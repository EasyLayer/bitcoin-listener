import { Injectable } from '@nestjs/common';
import { WebsocketMessagesGateway } from '@easylayer/components/websocket-messages';

@Injectable()
export class WsMessagesService {
  constructor(private readonly wsMessagesGateway: WebsocketMessagesGateway) {}

  public async processMessages(messages: any): Promise<void> {
    for (const message of messages) {
      this.wsMessagesGateway.sendMessageToAll(message);
    }
  }

  public async processIncomingMessage(message: any): Promise<void> {
    console.log(message);
  }
}
