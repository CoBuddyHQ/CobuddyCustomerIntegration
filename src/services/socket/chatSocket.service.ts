import { io, Socket } from 'socket.io-client';
import { BASE_URL, TokenStorage } from '../api';

class ChatSocketService {
  private socket: Socket | null = null;
  private currentConversationId: string | null = null;

  async connect(conversationId: string, onMessage: (msg: any) => void) {
    this.disconnect();
    this.currentConversationId = conversationId;

    const token = await TokenStorage.getAccessToken();
    const serverUrl = BASE_URL.replace(/\/api\/v1\/?$/, '');

    this.socket = io(`${serverUrl}/chat`, {
      auth: { token: token || undefined },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      this.socket?.emit('join_conversation', { conversationId });
    });

    const handleIncoming = (msg: any) => {
      if (msg && (!msg.conversationId || msg.conversationId === this.currentConversationId)) {
        onMessage(msg);
      }
    };

    this.socket.on('receive_message', handleIncoming);
    this.socket.on('new_message', handleIncoming);
  }

  disconnect() {
    if (this.socket) {
      if (this.currentConversationId) {
        this.socket.emit('leave_conversation', { conversationId: this.currentConversationId });
      }
      this.socket.disconnect();
      this.socket = null;
      this.currentConversationId = null;
    }
  }
}

export const chatSocketService = new ChatSocketService();

