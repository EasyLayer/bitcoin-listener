import { Injectable } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

@Injectable()
export class BusinessConfig {
  @Transform(({ value }) => (value !== undefined ? Number(value) : Number.MAX_SAFE_INTEGER))
  @IsNumber()
  BITCOIN_LISTENER_MAX_BLOCK_HEIGHT: number = Number.MAX_SAFE_INTEGER;

  @Transform(({ value }) => (value !== undefined ? Number(value) : 0))
  @IsNumber()
  BITCOIN_LISTENER_START_BLOCK_HEIGHT: number = 0;

  @Transform(({ value }) => (value !== undefined ? value : 'BTC'))
  @IsString()
  BITCOIN_LISTENER_CURRENCY_TICKER: string = 'BTC';

  @Transform(({ value }) => (value !== undefined ? Number(value) : 8))
  @IsNumber()
  BITCOIN_LISTENER_CURRENCY_DIGITS: number = 8;
}
