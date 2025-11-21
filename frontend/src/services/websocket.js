class WebSocketService {
  constructor() {
    this.ws = null;
    this.userId = null;
    this.currentPath = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventHandlers = {
      ADDED: [],
      DELETED: [],
      RENAMED: []
    };
  }

  connect(userId) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.userId = userId;

    // Determine WebSocket URL based on environment
    // In development, React proxy doesn't handle WebSocket, so connect directly to backend
    // In production, use same host as the page
    const isDevelopment = window.location.port === '3000';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = isDevelopment ? '4000' : window.location.port;
    const wsUrl = `${protocol}//${host}:${port}/ws/${userId}`;

    console.log('Connecting to WebSocket:', wsUrl);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('========== WEBSOCKET CONNECTED ==========');
        console.log('✓ WebSocket connected successfully!');
        console.log('Connection state:', this.ws.readyState);
        this.reconnectAttempts = 0;

        // Subscribe to current path if set
        // Use a small delay to ensure WebSocket is fully ready
        if (this.currentPath !== null) {
          console.log('⏳ Auto-subscribing to pending path:', JSON.stringify(this.currentPath));
          setTimeout(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              const message = {
                type: 'subscribe',
                path: this.currentPath
              };
              console.log('✓ Sending auto-subscribe message:', JSON.stringify(message));
              this.ws.send(JSON.stringify(message));
              console.log('✓ Auto-subscribe message sent');
            } else {
              console.log('✗ WebSocket not ready for auto-subscribe');
            }
          }, 10);
        } else {
          console.log('No pending path to auto-subscribe');
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('========== WEBSOCKET MESSAGE RECEIVED ==========');
          console.log('Raw data:', event.data);
          console.log('Parsed message:', message);
          console.log('Event type:', message.type);
          console.log('Number of handlers for this type:', this.eventHandlers[message.type]?.length || 0);

          const eventType = message.type;
          if (this.eventHandlers[eventType]) {
            console.log(`Calling ${this.eventHandlers[eventType].length} handler(s) for ${eventType}`);
            this.eventHandlers[eventType].forEach(handler => {
              handler(message);
            });
          } else {
            console.warn('No handlers registered for event type:', eventType);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

      setTimeout(() => {
        if (this.userId) {
          this.connect(this.userId);
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnect attempts reached');
    }
  }

  subscribePath(path) {
    console.log('========== SUBSCRIBE PATH CALLED ==========');
    console.log('Path:', JSON.stringify(path));
    console.log('Path length:', path.length);
    console.log('WebSocket state:', this.ws ? this.ws.readyState : 'null');
    
    this.currentPath = path;

    // Only send if WebSocket is fully open
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'subscribe',
        path: path
      };
      console.log('✓ Sending WebSocket subscribe message:', JSON.stringify(message));
      try {
        this.ws.send(JSON.stringify(message));
        console.log('✓ Subscribe message sent successfully');
      } catch (error) {
        console.error('✗ Error sending subscribe message:', error);
        // Path is saved and will be subscribed when connection is ready
      }
    } else if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      console.log('⏳ WebSocket is connecting. Path saved and will subscribe when opened.');
      // Path is already saved in this.currentPath and will be sent in onopen handler
    } else {
      console.log('✗ WebSocket not ready (state:', this.ws ? this.ws.readyState : 'null', '). Path saved and will subscribe when connected.');
    }
  }

  on(eventType, handler) {
    if (this.eventHandlers[eventType]) {
      this.eventHandlers[eventType].push(handler);
    }
  }

  off(eventType, handler) {
    if (this.eventHandlers[eventType]) {
      this.eventHandlers[eventType] = this.eventHandlers[eventType].filter(
        h => h !== handler
      );
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton instance
const wsService = new WebSocketService();

export default wsService;
