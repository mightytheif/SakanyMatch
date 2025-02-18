import { WebSocket, WebSocketServer } from 'ws';
import { storage } from './storage';
import type { Message, User } from '@shared/schema';

interface ExtendedWebSocket extends WebSocket {
  userId?: number;
  isAlive: boolean;
}

type ChatMessage = {
  type: 'message';
  receiverId: number;
  content: string;
};

type WebSocketMessage = ChatMessage | { type: 'ping' };

export function setupWebSocket(wss: WebSocketServer) {
  const clients = new Map<number, ExtendedWebSocket>();

  function heartbeat(this: ExtendedWebSocket) {
    this.isAlive = true;
  }

  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (ws.isAlive === false) {
        clients.delete(ws.userId!);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on('connection', (ws: ExtendedWebSocket, req) => {
    // Extract user ID from the query string
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const userId = parseInt(url.searchParams.get('userId')!);
    
    if (!userId) {
      ws.close();
      return;
    }

    ws.userId = userId;
    ws.isAlive = true;
    clients.set(userId, ws);

    ws.on('pong', heartbeat);

    ws.on('message', async (data: string) => {
      try {
        const message: WebSocketMessage = JSON.parse(data);

        if (message.type === 'message') {
          // Store the message in the database
          const savedMessage = await storage.createMessage({
            senderId: ws.userId!,
            receiverId: message.receiverId,
            content: message.content,
            isRead: false,
          });

          // Update or create conversation
          await storage.updateConversation(ws.userId!, message.receiverId);

          // Forward the message to the receiver if they're online
          const receiverWs = clients.get(message.receiverId);
          if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
            receiverWs.send(JSON.stringify({
              type: 'message',
              message: savedMessage,
            }));
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });

    ws.on('close', () => {
      clients.delete(userId);
    });
  });
}
