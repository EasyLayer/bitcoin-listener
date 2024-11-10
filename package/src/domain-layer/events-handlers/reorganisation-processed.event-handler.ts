import { EventsHandler, IEventHandler } from '@easylayer/components/cqrs';
import { RuntimeTracker } from '@easylayer/components/logger';
import { BitcoinListenerReorganisationProcessedEvent } from '@easylayer/common/domain-cqrs-components/bitcoin-listener';

@EventsHandler(BitcoinListenerReorganisationProcessedEvent)
export class BitcoinListenerReorganisationProcessedEventHandler
  implements IEventHandler<BitcoinListenerReorganisationProcessedEvent>
{
  constructor() {} // private readonly outputsReadService: OutputsReadService

  @RuntimeTracker({ showMemory: true })
  async handle({ payload }: BitcoinListenerReorganisationProcessedEvent) {
    console.log(payload);
    // try {
    //   const { blocks } = payload;
    //   const txids: string[] = [];
    //   blocks.forEach((block: any) => {
    //     const { tx } = block;
    //     if (Array.isArray(tx)) {
    //       tx.forEach((t) => txids.push(t));
    //     }
    //   });
    //   // NOTE: At the moment we do not delete reorganized outputs, but flag outputs as suspended
    //   await this.outputsReadService.updateWithBuilder({ txid: txids }, { is_suspended: true });
    // } catch (error) {
    //   if (error instanceof QueryFailedError) {
    //     const driverError = error.driverError;
    //     if (driverError.code === 'SQLITE_CONSTRAINT') {
    //       throw new Error(driverError.message);
    //     }
    //     if (driverError.code === '23505') {
    //       throw new Error(driverError.detail);
    //     }
    //   }
    //   throw error;
    // }
  }
}
