import { Schema, generateModelFromSchema } from '@easylayer/components/views-keyvalue-db';

export const LastBlockSchema = new Schema({
  prefix: 'lastblock',
  separator: ':',
  paths: {
    height: {
      type: 'dynamic',
      required: true,
    },
  },
  values: {
    type: 'string',
  },
});

export const LastBlockModel = generateModelFromSchema(LastBlockSchema);
