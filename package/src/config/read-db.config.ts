import { resolve } from 'node:path';
import { Injectable } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

type DatabaseTypes = 'rocksdb';

@Injectable()
export class ReadDatabaseConfig {
  @Transform(({ value }) => (value ? value : 'rocksdb'))
  @IsString()
  BITCOIN_LISTENER_READ_DB_TYPE: DatabaseTypes = 'rocksdb';

  @Transform(({ value }) => (value ? value : ''))
  @IsString()
  BITCOIN_LISTENER_READ_DB_NAME: string = resolve(process.cwd(), `data/listener-views.db`);

  isLogging(): boolean {
    return process.env.DB_DEBUG === '1';
  }
}
