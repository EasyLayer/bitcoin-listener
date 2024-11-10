import { Schema, generateModelFromSchema } from '@easylayer/components/views-keyvalue-db';

export const EventSchema = new Schema({
  prefix: 'event',
  separator: ':',
  paths: {
    height: {
      type: 'dynamic',
      required: true,
    },
    event: {
      type: 'dynamic',
      required: true,
    },
  },
  values: {
    type: 'string',
  },
});

export const EventModel = generateModelFromSchema(EventSchema);
