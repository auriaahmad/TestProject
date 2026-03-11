import { useEffect, useRef } from 'react';

interface SeatUpdateMessage {
  type: 'seat-update';
  seatId: string;
  status: string;
}

type MessageHandler = (msg: SeatUpdateMessage) => void;

const WS_URL = 'ws://localhost:4001';
const RECONNECT_DELAY = 3000;

export function useWebSocket(onMessage: MessageHandler) {
  const handlerRef = useRef(onMessage);

  useEffect(() => {
    handlerRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    function connect() {
      if (disposed) return;

      try {
        ws = new WebSocket(WS_URL);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data as string) as SeatUpdateMessage;
            if (data.type === 'seat-update') {
              handlerRef.current(data);
            }
          } catch {
            // ignore parse errors
          }
        };

        ws.onclose = () => {
          ws = null;
          if (!disposed) {
            reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
          }
        };

        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        if (!disposed) {
          reconnectTimer = setTimeout(connect, RECONNECT_DELAY);
        }
      }
    }

    connect();

    return () => {
      disposed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);
}
