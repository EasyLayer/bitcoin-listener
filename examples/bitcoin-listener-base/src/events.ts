import { BaseViewModel } from '@easylayer/bitcoin-listener';

export class BlockEvent implements BaseViewModel {
  type: string = 'newblock';
  data: any;

  constructor(data: any) {
    this.data = data;
  }
}

export class TransactionEvent implements BaseViewModel {
    type: string = 'newtx';
    data: any;
  
    constructor(data: any) {
      this.data = data;
    }
}
