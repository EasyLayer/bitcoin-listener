import { v4 as uuidv4 } from 'uuid';
import { Injectable, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Saga, ICommand, executeWithRetry } from '@easylayer/components/cqrs';
import { BlocksQueueService } from '@easylayer/components/bitcoin-blocks-queue';
import {
  BitcoinListenerReorganisationStartedEvent,
  BitcoinListenerReorganisationFinishedEvent,
} from '@easylayer/common/domain-cqrs-components/bitcoin-listener';
import { ListenerCommandFactoryService } from '../services';

@Injectable()
export class ListenerSaga {
  constructor(
    private readonly listenerCommandFactory: ListenerCommandFactoryService,
    @Inject('BlocksQueueService') private readonly blocksQueueService: BlocksQueueService
  ) {}

  @Saga()
  onBitcoinListenerReorganisationStartedEvent(events$: Observable<any>): Observable<ICommand> {
    return events$.pipe(
      executeWithRetry({
        event: BitcoinListenerReorganisationStartedEvent,
        command: ({ payload }: BitcoinListenerReorganisationStartedEvent) =>
          this.listenerCommandFactory.processReorganisation({
            blocks: payload.blocks,
            height: payload.height,
            // IMPORTANT: Generate a new requestId here
            // since the reorganisation event is triggered automatically recursively.
            requestId: uuidv4(),
          }),
      })
    );
  }

  @Saga()
  onBitcoinListenerReorganisationFinishedEvent(events$: Observable<any>): Observable<ICommand> {
    return events$.pipe(
      executeWithRetry({
        event: BitcoinListenerReorganisationFinishedEvent,
        command: ({ payload }: BitcoinListenerReorganisationFinishedEvent) =>
          this.blocksQueueService.reorganizeBlocks(payload.height),
      })
    );
  }
}
