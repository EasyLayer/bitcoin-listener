import { IListenerMapper, BlockchainEvent } from '@easylayer/bitcoin-listener';
import { ScriptUtilService } from '@easylayer/components/bitcoin-network-provider';
import { Currency, Money } from '@easylayer/common/arithmetic';
import { DepositEvent } from './events';
import { addresses } from './addreses';

export class EventsMapper implements IListenerMapper {
    public async handle(block: any) {
        const currency: Currency = {
            code: 'BTC',
            minorUnit: 8,
        };

        const { hash, tx } = block;

        const events: BlockchainEvent[] = [];

        if (!tx || tx.length === 0) {
          throw new Error(`Tx length = 0`);
        }

        tx.forEach((t: any) => {
            const { txid, vout } = t;
            vout.forEach((output: any) => {
                const address = ScriptUtilService.getScriptHashFromScriptPubKey(vout.scriptPubKey);

                if (address && addresses.includes(address)) {
                    const value = Money.fromDecimal(output.value, currency).toCents();

                    events.push(new DepositEvent({
                        txid,
                        value,
                        blockHash: hash
                    }));
                }
            });
        });

        return events;
    }

    public async reorganisation(blocksHashes: string[]) {
        return {} as any;
    }
}