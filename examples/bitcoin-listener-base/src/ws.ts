import { io } from 'socket.io-client';

export const initializeWebSocket = () => {
  const socketUrl = `http://localhost:3000`;

  const socket = io(socketUrl);

  socket.on('open', () => {
    console.log('Connected to WebSocket server');
  });

  socket.on('message', (data: any) => {
    try {
      const parsedData = JSON.parse(data.toString());

      processReceivedEvent(parsedData.payload);

      // This commit event will clear the cache of old events in the listener.
      const dataToSend = {
        type: 'commit',
        payload: { blockHeight: 10000 }
      };

      socket.send(JSON.stringify(dataToSend));
    } catch (error) {
      console.error('Failed to parse message', error);
    }
  });

  socket.on('close', () => {
    console.log('Disconnected from WebSocket server');
  });

  socket.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  const processReceivedEvent = (event: any) => {
    console.log('Received event:', event);
  }
}