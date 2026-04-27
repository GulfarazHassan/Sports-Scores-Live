import { useState, useEffect, useRef, useCallback } from 'react';
import { WS_BASE_URL, INITIAL_RECONNECT_DELAY, MAX_RECONNECT_DELAY } from '../constants';
import { ConnectionStatus, WSMessage } from '../types';

interface UseWebSocketReturn {
  status: ConnectionStatus;
  connectGlobal: () => void;
  subscribeMatch: (matchId: string | number) => void;
  unsubscribeMatch: (matchId: string | number) => void;
  disconnect: () => void;
}

function detachWebSocketListeners(socket: WebSocket) {
  socket.onopen = null;
  socket.onmessage = null;
  socket.onerror = null;
  socket.onclose = null;
}

export const useWebSocket = (
  onMessage: (msg: WSMessage) => void
): UseWebSocketReturn => {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  
  const ws = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const isIntentionalClose = useRef(false);
  const subscribedMatchIdsRef = useRef(new Set<string>());

  const normalizeId = (matchId: string | number) => String(matchId);

  const sendMessage = useCallback((message: WSMessage | Record<string, unknown>) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    }
  }, []);

  // Core connect function — may run from reconnect timers; do not open a new socket if one is already good.
  const initConnection = useCallback(() => {
    if (ws.current) {
      const state = ws.current.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        return;
      }
      // Replaced or failed socket: clear listeners so its late onclose does not schedule another reconnect
      detachWebSocketListeners(ws.current);
      isIntentionalClose.current = true;
      try {
        ws.current.close();
      } catch {
        // ignore
      }
      isIntentionalClose.current = false;
      ws.current = null;
    }

    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }

    setStatus(reconnectAttempts.current > 0 ? 'reconnecting' : 'connecting');

    // Construct URL
    const socketUrl = `${WS_BASE_URL}?all=1`;
    
    try {
      const socket = new WebSocket(socketUrl);
      ws.current = socket;

      socket.onopen = () => {
        setStatus('connected');
        reconnectAttempts.current = 0;
        if (subscribedMatchIdsRef.current.size > 0) {
          socket.send(JSON.stringify({
            type: 'setSubscriptions',
            matchIds: Array.from(subscribedMatchIdsRef.current),
          }));
        }
        console.log('[WebSocket] Connected successfully');
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current(data);
        } catch (e) {
          console.error('[WebSocket] Failed to parse message:', e);
        }
      };

      socket.onerror = (event) => {
        // WebSocket error events are generic in browsers and don't contain descriptive messages.
        // We log it to indicate an issue occurred.
        console.warn('[WebSocket] Connection error occurred');
        
        // Only set error status if we were connected; otherwise let onclose handle it
        if (ws.current?.readyState === WebSocket.OPEN) {
             setStatus('error');
        }
      };

      socket.onclose = (event) => {
        // If we already opened a newer socket, this close is obsolete — do not reconnect
        if (event.target !== ws.current) {
          return;
        }
        if (!isIntentionalClose.current) {
          setStatus('disconnected');
          
          // Exponential backoff for real reconnection attempts
          const delay = Math.min(
            INITIAL_RECONNECT_DELAY * (2 ** reconnectAttempts.current),
            MAX_RECONNECT_DELAY
          );
          
          console.log(`[WebSocket] Disconnected (Code: ${event.code}). Reconnecting in ${delay}ms...`);
          
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current += 1;
            initConnection();
          }, delay);
        } else {
            // If closed intentionally, just set status
            setStatus('disconnected');
        }
      };

    } catch (e) {
      console.error('[WebSocket] Connection creation failed:', e);
      setStatus('error');
    }
  }, []);

  // Public connect method
  const connectGlobal = useCallback(() => {
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    reconnectAttempts.current = 0;
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    initConnection();
  }, [initConnection]);

  const subscribeMatch = useCallback((matchId: string | number) => {
    const normalized = normalizeId(matchId);
    subscribedMatchIdsRef.current.add(normalized);
    sendMessage({ type: 'subscribe', matchId });
  }, [sendMessage]);

  const unsubscribeMatch = useCallback((matchId: string | number) => {
    const normalized = normalizeId(matchId);
    subscribedMatchIdsRef.current.delete(normalized);
    sendMessage({ type: 'unsubscribe', matchId });
  }, [sendMessage]);

  // Public disconnect method
  const disconnect = useCallback(() => {
    isIntentionalClose.current = true;
    
    if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    
    if (ws.current) {
      detachWebSocketListeners(ws.current);
      try {
        ws.current.close();
      } catch {
        // ignore
      }
      ws.current = null;
    }
    
    setStatus('disconnected');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isIntentionalClose.current = true;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        detachWebSocketListeners(ws.current);
        try {
          ws.current.close();
        } catch {
          // ignore
        }
        ws.current = null;
      }
    };
  }, []);

  return { status, connectGlobal, subscribeMatch, unsubscribeMatch, disconnect };
};
