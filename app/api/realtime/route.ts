import { NextRequest } from 'next/server';
import { realtimeBus } from '@/lib/realtime-bus';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event: 'connected', timestamp: Date.now() })}\n\n`));

      const onRealtimeChange = (payload: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          // ignore closed stream
        }
      };

      realtimeBus.on('change', onRealtimeChange);

      // Heartbeat every 15 seconds to keep SSE connection alive
      const timer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
        } catch {
          clearInterval(timer);
        }
      }, 15000);

      request.signal.addEventListener('abort', () => {
        realtimeBus.removeListener('change', onRealtimeChange);
        clearInterval(timer);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
