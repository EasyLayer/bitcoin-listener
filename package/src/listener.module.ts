import { Module, DynamicModule } from '@nestjs/common';
import { transformAndValidate } from 'class-transformer-validator';
import { CqrsModule } from '@easylayer/components/cqrs';
import { CqrsTransportModule } from '@easylayer/components/cqrs-transport';
import { LoggerModule } from '@easylayer/components/logger';
import { ArithmeticService } from '@easylayer/common/arithmetic';
import { BlocksQueueModule } from '@easylayer/components/bitcoin-blocks-queue';
import { ViewsKeyValueDatabaseModule } from '@easylayer/components/views-keyvalue-db';
import { WebsocketMessagesModule } from '@easylayer/components/websocket-messages';
import { EventStoreModule } from '@easylayer/components/eventstore';
import { NetworkProviderModule } from '@easylayer/components/bitcoin-network-provider';
import { ListenerController } from './listener.controller';
import { ListenerService } from './listener.service';
import { ListenerSaga, WsMessagesSaga } from './application-layer/sagas';
import {
  BlocksCommandFactoryService,
  ListenerCommandFactoryService,
  ReadStateExceptionHandlerService,
} from './application-layer/services';
import { ListenerModelFactoryService } from './domain-layer/services';
import { CommandHandlers } from './domain-layer/command-handlers';
import { EventsHandlers } from './domain-layer/events-handlers';
import {
  AppConfig,
  BusinessConfig,
  EventStoreConfig,
  ReadDatabaseConfig,
  BlocksQueueConfig,
  ProvidersConfig,
} from './config';
import { MapperType } from './protocol';
import { EventSchema, LastBlockSchema } from './infrastructure-layer/view-models';
import {
  ViewsReadRepositoryService,
  ViewsWriteRepositoryService,
  WsMessagesService,
} from './infrastructure-layer/services';

interface ListenerModuleOptions {
  appName: string;
  mapper: MapperType;
  //...
}

@Module({})
export class BitcoinListenerModule {
  static async register({ appName, mapper }: ListenerModuleOptions): Promise<DynamicModule> {
    const eventstoreConfig = await transformAndValidate(EventStoreConfig, process.env, {
      validator: { whitelist: true },
    });
    const readdatabaseConfig = await transformAndValidate(ReadDatabaseConfig, process.env, {
      validator: { whitelist: true },
    });
    const appConfig = await transformAndValidate(AppConfig, process.env, {
      validator: { whitelist: true },
    });
    const businessConfig = await transformAndValidate(BusinessConfig, process.env, {
      validator: { whitelist: true },
    });
    const blocksQueueConfig = await transformAndValidate(BlocksQueueConfig, process.env, {
      validator: { whitelist: true },
    });
    const providersConfig = await transformAndValidate(ProvidersConfig, process.env, {
      validator: { whitelist: true },
    });

    return {
      module: BitcoinListenerModule,
      controllers: [ListenerController],
      imports: [
        LoggerModule.forRoot({ componentName: appName }),
        CqrsTransportModule.forRoot({ isGlobal: true }),
        CqrsModule.forRoot({ isGlobal: true }),
        WebsocketMessagesModule.forRootAsync({}),
        // IMPORTANT: BitcoinNetworkProviderModule must be global inside one plugin
        NetworkProviderModule.forRootAsync({
          isGlobal: true,
          quickNodesUrls: providersConfig.BITCOIN_LISTENER_NETWORK_PROVIDER_QUICK_NODE_URLS,
          selfNodesUrl: providersConfig.BITCOIN_LISTENER_NETWORK_PROVIDER_SELF_NODE_URL,
        }),
        EventStoreModule.forRootAsync({
          name: 'listener-eventstore',
          logging: eventstoreConfig.isLogging(),
          type: eventstoreConfig.BITCOIN_LISTENER_EVENTSTORE_DB_TYPE,
          database: eventstoreConfig.BITCOIN_LISTENER_EVENTSTORE_DB_NAME,
          ...(eventstoreConfig.BITCOIN_LISTENER_EVENTSTORE_DB_HOST && {
            host: eventstoreConfig.BITCOIN_LISTENER_EVENTSTORE_DB_HOST,
          }),
          ...(eventstoreConfig.BITCOIN_LISTENER_EVENTSTORE_DB_PORT && {
            port: eventstoreConfig.BITCOIN_LISTENER_EVENTSTORE_DB_PORT,
          }),
          ...(eventstoreConfig.BITCOIN_LISTENER_EVENTSTORE_DB_USERNAME && {
            username: eventstoreConfig.BITCOIN_LISTENER_EVENTSTORE_DB_USERNAME,
          }),
          ...(eventstoreConfig.BITCOIN_LISTENER_EVENTSTORE_DB_PASSWORD && {
            password: eventstoreConfig.BITCOIN_LISTENER_EVENTSTORE_DB_PASSWORD,
          }),
        }),
        ViewsKeyValueDatabaseModule.forRootAsync({
          database: readdatabaseConfig.BITCOIN_LISTENER_READ_DB_NAME,
          type: readdatabaseConfig.BITCOIN_LISTENER_READ_DB_TYPE,
          schemas: [EventSchema, LastBlockSchema],
        }),
        BlocksQueueModule.forRootAsync({
          blocksCommandExecutor: BlocksCommandFactoryService,
          isTransportMode: false,
          maxBlockHeight: businessConfig.BITCOIN_LISTENER_MAX_BLOCK_HEIGHT,
          queueLoaderRequestBlocksBatchSize:
            blocksQueueConfig.BITCOIN_LISTENER_BLOCKS_QUEUE_LOADER_REQUEST_BLOCKS_BATCH_SIZE,
          maxQueueSize: blocksQueueConfig.BITCOIN_LISTENER_BLOCKS_QUEUE_ITERATOR_BLOCKS_BATCH_SIZE,
          minTransferSize: blocksQueueConfig.BITCOIN_LISTENER_BLOCKS_QUEUE_MIN_TRANSFER_SIZE,
          queueLoaderStrategyName: blocksQueueConfig.BITCOIN_LISTENER_BLOCKS_QUEUE_LOADER_STRATEGY_NAME,
          queueIteratorBlocksBatchSize: blocksQueueConfig.BITCOIN_LISTENER_BLOCKS_QUEUE_ITERATOR_BLOCKS_BATCH_SIZE,
          queueLoaderConcurrency: blocksQueueConfig.BITCOIN_LISTENER_BLOCKS_QUEUE_LOADER_CONCURRENCY_COUNT,
        }),
      ],
      providers: [
        {
          provide: AppConfig,
          useValue: appConfig,
        },
        {
          provide: BusinessConfig,
          useValue: businessConfig,
        },
        {
          provide: EventStoreConfig,
          useValue: eventstoreConfig,
        },
        {
          provide: ReadDatabaseConfig,
          useValue: readdatabaseConfig,
        },
        {
          provide: 'ListenerMapper',
          useClass: mapper,
        },
        ViewsReadRepositoryService,
        ViewsWriteRepositoryService,
        WsMessagesService,
        ArithmeticService,
        ListenerService,
        ListenerSaga,
        WsMessagesSaga,
        BlocksCommandFactoryService,
        ListenerCommandFactoryService,
        ListenerModelFactoryService,
        ReadStateExceptionHandlerService,
        ...CommandHandlers,
        ...EventsHandlers,
      ],
      exports: [],
    };
  }
}
