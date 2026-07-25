'use client';

import { useEffect } from 'react';

export function useRealtime(onEvent: (event: string, data: any) => void) {
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimeout: NodeJS.Timeout;

    const connect = () => {
      eventSource = new EventSource('/api/realtime');

      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload?.event) {
            onEvent(payload.event, payload.data);
          }
        } catch {
          // ignore heartbeat or parse error
        }
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
        }
        // Try reconnecting after 3 seconds
        retryTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearTimeout(retryTimeout);
    };
  }, [onEvent]);
}
