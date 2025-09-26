export class WebSocketService {
  private static ws: WebSocket | null = null;
  private static userId: string | null = null;
  private static onMessageCallback?: (data: any) => void;
  private static onErrorCallback?: (message: string) => void;
  private static reconnectAttempts = 0;
  private static maxReconnectAttempts = 5;
  private static reconnectInterval = 1000; // Start with 1 second
  private static connectionError = false;

  static connect(userId: string, onMessage: (data: any) => void, onError?: (message: string) => void): void {
    WebSocketService.userId = userId;
    WebSocketService.onMessageCallback = onMessage;
    WebSocketService.onErrorCallback = onError;
    WebSocketService.connectionError = false;

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://localhost:8001'}/ws/${userId}`;
    console.log('Connecting to WebSocket:', wsUrl);

    try {
      // Close existing connection if any
      if (WebSocketService.ws) {
        WebSocketService.ws.close();
      }
      WebSocketService.ws = new WebSocket(wsUrl);

      WebSocketService.ws.onopen = () => {
        console.log('WebSocket connected for user', userId);
        WebSocketService.reconnectAttempts = 0;
        WebSocketService.reconnectInterval = 1000;

        // Show connection status notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Connected', {
            body: 'Real-time messaging is now active',
            icon: '/favicon.ico'
          });
        }
      };

      WebSocketService.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          if (data.type === 'new_message' && data.message) {
            onMessage(data.message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      WebSocketService.ws.onclose = (event) => {
        console.log('WebSocket connection closed for user', WebSocketService.userId, 'Code:', event.code);
        WebSocketService.attemptReconnect();
      };

      WebSocketService.ws.onerror = (error) => {
        console.log('In onerror, WebSocketService.ws is null?', WebSocketService.ws === null);
        console.error('WebSocket connection failed');
        console.log('WebSocket URL:', wsUrl);
        if (WebSocketService.ws) {
          console.log('WebSocket readyState:', WebSocketService.ws.readyState);
        } else {
          console.log('WebSocket is null, cannot log readyState');
        }
        console.log('Error event:', error);
        WebSocketService.connectionError = true;
        if (WebSocketService.onErrorCallback) {
          WebSocketService.onErrorCallback('WebSocket connection failed');
        }
        // Don't log the empty error object
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      WebSocketService.attemptReconnect();
    }
  }

  private static attemptReconnect(): void {
    if (WebSocketService.connectionError) {
      console.log('Not attempting reconnect due to connection error');
      return;
    }
    if (WebSocketService.reconnectAttempts >= WebSocketService.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    WebSocketService.reconnectAttempts++;
    console.log(`Attempting to reconnect (${WebSocketService.reconnectAttempts}/${WebSocketService.maxReconnectAttempts}) in ${WebSocketService.reconnectInterval}ms`);

    setTimeout(() => {
      if (WebSocketService.userId && WebSocketService.onMessageCallback) {
        WebSocketService.connect(WebSocketService.userId, WebSocketService.onMessageCallback);
      }
    }, WebSocketService.reconnectInterval);

    // Exponential backoff
    WebSocketService.reconnectInterval = Math.min(WebSocketService.reconnectInterval * 2, 30000);
  }

  static disconnect(): void {
    if (WebSocketService.ws) {
      WebSocketService.ws.close();
      WebSocketService.ws = null;
    }
    WebSocketService.userId = null;
    WebSocketService.onMessageCallback = undefined;
    WebSocketService.reconnectAttempts = 0;
  }

  static sendMessage(message: any): void {
    if (WebSocketService.ws && WebSocketService.ws.readyState === WebSocket.OPEN) {
      WebSocketService.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  static get isConnected(): boolean {
    return WebSocketService.ws?.readyState === WebSocket.OPEN;
  }
}