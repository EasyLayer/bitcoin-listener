import { CommandHandler, ICommandHandler } from '@easylayer/components/cqrs';
import { Transactional, EventStoreRepository } from '@easylayer/components/eventstore';
import { ProcessReorganisationCommand } from '@easylayer/common/domain-cqrs-components/bitcoin-listener';
import { AppLogger, RuntimeTracker } from '@easylayer/components/logger';
import { Listener } from '../models/listener.model';
import { ListenerModelFactoryService } from '../services';

@CommandHandler(ProcessReorganisationCommand)
export class ProcessReorganisationCommandHandler implements ICommandHandler<ProcessReorganisationCommand> {
  constructor(
    private readonly log: AppLogger,
    private readonly listenerModelFactory: ListenerModelFactoryService,
    private readonly eventStore: EventStoreRepository
  ) {}

  @Transactional({ connectionName: 'listener-eventstore' })
  @RuntimeTracker({ showMemory: true })
  async execute({ payload }: ProcessReorganisationCommand) {
    try {
      // NOTE: blocks - need to be reorganised (from ListenerModel),
      // height - is height of reorganisation(the last height where the blocks matched)
      const { blocks, height, requestId } = payload;

      const listenerModel: Listener = await this.listenerModelFactory.initModel();

      // NOTE: We could not store transactions in the aggregator, but get them here from the provider,
      // but this will increase the cost, so we store them for now

      await listenerModel.processReorganisation({
        blocks,
        height,
        requestId,
        logger: this.log,
      });

      await this.eventStore.save(listenerModel);

      this.listenerModelFactory.updateCache(listenerModel);

      await listenerModel.commit();
    } catch (error) {
      this.log.error('execute()', error, this.constructor.name);
      this.listenerModelFactory.clearCache();
      throw error;
    }
  }
}
