import { BlockchainEvent } from '@easylayer/bitcoin-listener';

export class DepositEvent implements BlockchainEvent {
  type: string = 'deposit';
  data: any;

  constructor(data: any) {
    this.data = data;
  }
}
