import { Test, TestingModule } from '@nestjs/testing';
import { BitcoinListenerModule } from '../listener.module';

describe('BitcoinListenerModule', () => {
  let bitcoinListenerModule: BitcoinListenerModule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BitcoinListenerModule],
    }).compile();

    bitcoinListenerModule = module.get<BitcoinListenerModule>(BitcoinListenerModule);
  });

  it('should be defined', () => {
    expect(bitcoinListenerModule).toBeDefined();
  });
});
