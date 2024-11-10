import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@easylayer/components/cqrs';
import { RuntimeTracker } from '@easylayer/components/logger';
import { BlocksQueueService } from '@easylayer/components/bitcoin-blocks-queue';
import { BitcoinListenerBlocksParsedEvent } from '@easylayer/common/domain-cqrs-components/bitcoin-listener';
import { ViewsWriteRepositoryService, WsMessagesService } from '../../infrastructure-layer/services';
import { LastBlockModel, EventModel } from '../../infrastructure-layer/view-models';
import { IListenerMapper } from '../../protocol';

@EventsHandler(BitcoinListenerBlocksParsedEvent)
export class BitcoinListenerBlocksParsedEventHandler implements IEventHandler<BitcoinListenerBlocksParsedEvent> {
  constructor(
    private readonly viewsWriteRepository: ViewsWriteRepositoryService,
    @Inject('BlocksQueueService')
    private readonly blocksQueueService: BlocksQueueService,
    @Inject('ListenerMapper')
    private readonly listenerMapper: IListenerMapper,
    private readonly wsMessagesService: WsMessagesService
  ) {}

  @RuntimeTracker({ showMemory: true })
  async handle({ payload }: BitcoinListenerBlocksParsedEvent) {
    try {
      const { blocks } = payload;

      const confirmedBlocks = await this.blocksQueueService.confirmProcessedBatch(
        blocks.map((block: any) => block.hash)
      );

      const messagesToProccessed: any = [];

      for (const block of confirmedBlocks) {
        const results = await this.listenerMapper.handle(block);
        const events = Array.isArray(results) ? results : [results];

        const models: any = [];

        for (const e of events) {
          const event = new EventModel();
          await event.put({ height: block.height, event: JSON.stringify(e) }, { value: '' });

          models.push(event);
        }

        this.viewsWriteRepository.add(models);

        messagesToProccessed.push(...events);
      }

      // Update LastBlock model
      const lastBlock = new LastBlockModel();
      const lastBlockHeight = confirmedBlocks[confirmedBlocks.length - 1]?.height;
      await lastBlock.put({ height: lastBlockHeight }, { value: '' });

      this.viewsWriteRepository.add([lastBlock]);

      await this.viewsWriteRepository.commit();
      await this.wsMessagesService.processMessages(messagesToProccessed);
    } catch (error) {
      throw error;
    }
  }
}
