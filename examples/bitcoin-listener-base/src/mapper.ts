import { IListenerMapper, BaseViewModel } from '@easylayer/bitcoin-listener';
import { BlockEvent, TransactionEvent } from './events';

export class EventsMapper implements IListenerMapper {
    public async handle(block: any) {
        const { hash, tx } = block;

        const events: BaseViewModel[] = [];
        
        events.push(new BlockEvent({ ...block }));

        if (!tx || tx.length === 0) {
          throw new Error(`Tx length = 0`);
        }

        tx.forEach((t: any) => {
            const { txid, vin, vout } = t;

            events.push(new TransactionEvent({
                txid,
                vin,
                vout,
                block_hash: hash
            }));
        });

        return events;
    }

    public async reorganisation(blocksHashes: string[]) {
        return {} as any;
    }
}