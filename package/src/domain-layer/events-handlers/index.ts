import { BitcoinListenerBlocksParsedEventHandler } from './blocks-parsed.event-handler';
import { BitcoinListenerInitializedEventHandler } from './listener-initialized.event-handler';
import { BitcoinListenerReorganisationProcessedEventHandler } from './reorganisation-processed.event-handler';

export const EventsHandlers = [
  BitcoinListenerBlocksParsedEventHandler,
  BitcoinListenerInitializedEventHandler,
  BitcoinListenerReorganisationProcessedEventHandler,
];
