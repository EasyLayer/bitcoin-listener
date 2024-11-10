import { CommandHandler, ICommandHandler } from '@easylayer/components/cqrs';
import { Transactional, EventStoreRepository } from '@easylayer/components/eventstore';
import { InitListenerCommand } from '@easylayer/common/domain-cqrs-components/bitcoin-listener';
import { AppLogger, RuntimeTracker } from '@easylayer/components/logger';
import { Listener } from '../models/listener.model';
import { ListenerModelFactoryService } from '../services';

@CommandHandler(InitListenerCommand)
export class InitListenerCommandHandler implements ICommandHandler<InitListenerCommand> {
  constructor(
    private readonly log: AppLogger,
    private readonly eventStore: EventStoreRepository,
    private readonly listenerModelFactory: ListenerModelFactoryService
  ) {}

  @Transactional({ connectionName: 'listener-eventstore' })
  @RuntimeTracker({ showMemory: true })
  async execute({ payload }: InitListenerCommand) {
    try {
      const { requestId, indexedHeight } = payload;

      this.log.info('Init Listener Aggregate...', null, this.constructor.name);

      const listenerModel: Listener = await this.listenerModelFactory.initModel();

      this.log.info('Listener Aggregate successfully initialized.', null, this.constructor.name);

      await listenerModel.init({
        requestId,
        indexedHeight,
        // indexedHeight < this.businessConfig.BITCOIN_LISTENER_START_BLOCK_HEIGHT - 1
        //   ? this.businessConfig.BITCOIN_LISTENER_START_BLOCK_HEIGHT - 1
        //   : indexedHeight,
      });

      await this.eventStore.save(listenerModel);
      await listenerModel.commit();

      this.log.info('Aggregates successfull init', null, this.constructor.name);
    } catch (error) {
      this.log.error('execute()', error, this.constructor.name);
      throw error;
    }
  }
}
