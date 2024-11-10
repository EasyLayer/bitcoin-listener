import { AggregateRoot } from '@easylayer/components/cqrs';
import {
  NetworkProviderService,
  LightBlock,
  Blockchain,
  restoreChainLinks,
} from '@easylayer/components/bitcoin-network-provider';
import {
  BitcoinListenerInitializedEvent,
  BitcoinListenerBlocksParsedEvent,
  BitcoinListenerReorganisationStartedEvent,
  BitcoinListenerReorganisationFinishedEvent,
  BitcoinListenerReorganisationProcessedEvent,
} from '@easylayer/common/domain-cqrs-components/bitcoin-listener';

enum ListenerStatuses {
  AWAITING = 'awaiting',
  REORGANISATION = 'reorganisation',
}

export class Listener extends AggregateRoot {
  // IMPORTANT: There must be only one Listener Aggregate in the module,
  // so we immediately give it aggregateId by which we can find it.
  public aggregateId: string = 'listener';
  public status: ListenerStatuses = ListenerStatuses.AWAITING;
  // IMPORTANT: 'maxSize' must be NOT LESS than the number of blocks in a single batch when iterating over BlocksQueue.
  // The number of blocks in a batch depends on the block size,
  // so we must take the smallest blocks in the network,
  // and make sure that they fit into a single batch less than the value of 'maxSize' .
  public chain: Blockchain = new Blockchain({ maxSize: 3000 });

  protected toJsonPayload(): any {
    return {
      status: this.status,
      // Convert Blockchain to an array of blocks
      chain: this.chain.toArray(),
    };
  }

  protected fromSnapshot(state: any): void {
    this.status = state.status;
    if (state.chain && Array.isArray(state.chain)) {
      this.chain = new Blockchain({ maxSize: 3000 });
      this.chain.fromArray(state.chain);
      // Recovering links in Blockchain
      restoreChainLinks(this.chain.head);
    }
  }

  // IMPORTANT: this method doing two things:
  // 1 - create Listener if it's first creation
  // 2 - use already created params but still publish event
  public async init({ requestId, indexedHeight }: { requestId: string; indexedHeight: number }) {
    // IMPORTANT: We always initialize the Listener with the awaiting status,
    // if there was a reorganization status, then it will be processed at the next iteration.
    const status = ListenerStatuses.AWAITING;

    const height =
      this.chain.lastBlockHeight !== undefined
        ? indexedHeight < this.chain.lastBlockHeight
          ? indexedHeight
          : this.chain.lastBlockHeight
        : indexedHeight;

    await this.apply(
      new BitcoinListenerInitializedEvent({
        aggregateId: this.aggregateId,
        requestId,
        status,
        indexedHeight: height.toString(),
      })
    );
  }

  public async addBlocks({
    blocks,
    requestId,
    service,
    logger,
  }: {
    blocks: any;
    requestId: string;
    service: any;
    logger: any;
  }) {
    if (this.status !== ListenerStatuses.AWAITING) {
      throw new Error("addBlocks() Reorganisation hasn't finished yet");
    }

    const isValid = this.chain.validateNextBlocks(blocks);

    if (!isValid) {
      return await this.startReorganisation({
        height: this.chain.lastBlockHeight!,
        requestId,
        service,
        logger,
        blocks: [],
      });
    }

    return await this.apply(
      new BitcoinListenerBlocksParsedEvent({
        aggregateId: this.aggregateId,
        requestId,
        status: ListenerStatuses.AWAITING,
        blocks: blocks.map((block: any) => ({
          ...block,
          tx: block.tx.map((t: any) => t.txid),
        })),
      })
    );
  }

  public async processReorganisation({
    blocks,
    height,
    requestId,
    logger,
  }: {
    blocks: LightBlock[];
    height: string | number;
    requestId: string;
    logger: any;
  }): Promise<void> {
    if (this.status !== ListenerStatuses.REORGANISATION) {
      throw new Error("processReorganisation() Reorganisation hasn't started yet");
    }

    if (Number(height) > this.chain.lastBlockHeight!) {
      throw new Error('Wrong block height');
    }

    // TODO: Task SH-15
    // if (blocks.length > 100) {
    //   const blocksToProcessed = blocks;

    //   logger.info(
    //     `Blockchain continue reorganising by blocks count`,
    //     {
    //       blocksLength: blocksToProcessed.length,
    //     },
    //     this.constructor.name
    //   );

    //   return await this.apply(
    //     new BitcoinListenerReorganisationProcessedEvent({
    //       aggregateId: this.aggregateId,
    //       requestId,
    //       // NOTE: height - height of reorganization (last correct block)
    //       height: height.toString(),
    //       blocks: blocksToProcessed,
    //     })
    //   );
    // }

    logger.info(
      `Blockchain successfull reorganised to height`,
      {
        height,
      },
      this.constructor.name
    );

    return await this.apply(
      new BitcoinListenerReorganisationFinishedEvent({
        aggregateId: this.aggregateId,
        requestId,
        status: ListenerStatuses.AWAITING,
        // NOTE: height - height of reorganization (last correct block)
        height: height.toString(),
        blocks,
      })
    );
  }

  public async startReorganisation({
    height,
    requestId,
    service,
    logger,
    blocks,
  }: {
    height: number;
    requestId: string;
    service: NetworkProviderService;
    logger: any;
    blocks: any[];
  }): Promise<void> {
    if (this.status !== ListenerStatuses.AWAITING) {
      throw new Error("reorganisation() Previous reorganisation hasn't finished yet");
    }

    const localBlock = this.chain.findBlockByHeight(height)!;
    const oldBlock = await service.getOneBlockByHeight(height);

    if (oldBlock.hash === localBlock.hash && oldBlock.previousblockhash === localBlock.previousblockhash) {
      // Match found

      logger.info(
        'Blockchain reorganisation starting',
        {
          reorganisationHeight: height.toString(),
          blocksLength: blocks.length,
          txLength: blocks.reduce((result: number, item: any) => result + item.tx.length, 0),
        },
        this.constructor.name
      );

      return await this.apply(
        new BitcoinListenerReorganisationStartedEvent({
          aggregateId: this.aggregateId,
          requestId,
          status: ListenerStatuses.REORGANISATION,
          // NOTE: height - is height of reorganisation(the last height where the blocks matched)
          height: height.toString(),
          // NOTE: blocks that need to be reorganized
          blocks,
        })
      );
    }

    // Saving blocks for publication in an event
    const newBlocks = [...blocks, localBlock];
    const prevHeight = height - 1;

    // Recursive check the previous block
    return this.startReorganisation({ height: prevHeight, requestId, service, logger, blocks: newBlocks });
  }

  private onBitcoinListenerInitializedEvent({ payload }: BitcoinListenerInitializedEvent) {
    const { aggregateId, status } = payload;
    this.aggregateId = aggregateId;
    this.status = status as ListenerStatuses;
  }

  private onBitcoinListenerBlocksParsedEvent({ payload }: BitcoinListenerBlocksParsedEvent) {
    const { blocks, status } = payload;

    this.status = status as ListenerStatuses;
    this.chain.addBlocks(
      blocks.map((block: any) => ({
        height: Number(block.height),
        hash: block.hash,
        previousblockhash: block?.previousblockhash || '',
        tx: block.tx.map((txid: any) => txid),
      }))
    );
  }

  private onBitcoinListenerReorganisationStartedEvent({ payload }: BitcoinListenerReorganisationStartedEvent) {
    const { status } = payload;
    this.status = status as ListenerStatuses;
  }

  // Here we cut full at once in height
  // This method is idempotent
  private onBitcoinListenerReorganisationFinishedEvent({ payload }: BitcoinListenerReorganisationFinishedEvent) {
    const { height, status } = payload;
    this.status = status as ListenerStatuses;
    this.chain.truncateToBlock(Number(height));
  }

  // Here we will only cut a few blocks
  // This method is idempotent
  private onBitcoinListenerReorganisationProcessedEvent({ payload }: BitcoinListenerReorganisationProcessedEvent) {
    const { blocks } = payload;
    this.chain.truncateToBlock(Number(blocks[0].height));
  }
}
