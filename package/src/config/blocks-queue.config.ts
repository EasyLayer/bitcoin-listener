import { Injectable } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

@Injectable()
export class BlocksQueueConfig {
  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 1))
  @IsNumber()
  BITCOIN_LISTENER_BLOCKS_QUEUE_LOADER_CONCURRENCY_NUM: number = 1;

  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 100 * 4 * 1024 * 1024))
  @IsNumber()
  BITCOIN_LISTENER_BLOCKS_QUEUE_MAX_SIZE: number = 100 * 4 * 1024 * 1024;

  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 1048576))
  @IsNumber()
  BITCOIN_LISTENER_BLOCKS_QUEUE_MIN_TRANSFER_SIZE: number = 1 * 1024 * 1024; // 1 MB;

  @Transform(({ value }) => (value !== undefined ? value : 'pull-network-provider'))
  @IsString()
  BITCOIN_LISTENER_BLOCKS_QUEUE_LOADER_STRATEGY_NAME: string = 'pull-network-provider';

  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 1 * 1024 * 1024))
  @IsNumber()
  BITCOIN_LISTENER_BLOCKS_QUEUE_ITERATOR_BLOCKS_BATCH_SIZE: number = 1 * 1024 * 1024;

  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 10 * 1024 * 1024))
  @IsNumber()
  BITCOIN_LISTENER_BLOCKS_QUEUE_LOADER_REQUEST_BLOCKS_BATCH_SIZE: number = 10 * 1024 * 1024; // 10 MB;

  @Transform(({ value }) => (value !== undefined ? parseInt(value, 10) : 1))
  @IsNumber()
  BITCOIN_LISTENER_BLOCKS_QUEUE_LOADER_CONCURRENCY_COUNT: number = 1;
}
