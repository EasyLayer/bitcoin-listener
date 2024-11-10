import { Inject } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@easylayer/components/cqrs';
import { RuntimeTracker } from '@easylayer/components/logger';
import { BlocksQueueService } from '@easylayer/components/bitcoin-blocks-queue';
import { KeyManagementService, NetworkProviderService } from '@easylayer/components/bitcoin-network-provider';
import { BitcoinListenerInitializedEvent } from '@easylayer/common/domain-cqrs-components/bitcoin-listener';
import { BusinessConfig } from '../../config/business.config';

@EventsHandler(BitcoinListenerInitializedEvent)
export class BitcoinListenerInitializedEventHandler implements IEventHandler<BitcoinListenerInitializedEvent> {
  constructor(
    private readonly businessConfig: BusinessConfig,
    private readonly keyManagementService: KeyManagementService,
    private readonly networkProviderService: NetworkProviderService,
    @Inject('BlocksQueueService') private readonly blocksQueueService: BlocksQueueService
  ) {}

  @RuntimeTracker({ showMemory: true })
  async handle({ payload }: BitcoinListenerInitializedEvent) {
    try {
      const { indexedHeight } = payload;
      // IMPORTANT: We will only start loading to the blocks queue after the restoration of the Read State
      // TODO: move it from here
      this.blocksQueueService.start(indexedHeight);
    } catch (error) {
      throw error;
    }
  }
}
