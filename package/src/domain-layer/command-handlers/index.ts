import { HandleBatchCommandHandler } from './handle-blocks-batch.command-handler';
import { InitListenerCommandHandler } from './init-listener.command-handler';
import { ProcessReorganisationCommandHandler } from './process-reorganisation.command-handler';

export const CommandHandlers = [
  HandleBatchCommandHandler,
  InitListenerCommandHandler,
  ProcessReorganisationCommandHandler,
];
