import { NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { realtimeEventBus } from '@/lib/realtime/eventBus';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/stream
 * Server-Sent Events (SSE) live pipeline for connected staff browser sessions.
 * Streams task updates, lane transitions, discussion notes, and in-app notifications.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    let cleanup: (() => void) | null = null;

    const stream = new ReadableStream({
      start(controller) {
        let isClosed = false;

        const safeEnqueue = (chunkText: string) => {
          if (isClosed) return;
          try {
            controller.enqueue(encoder.encode(chunkText));
          } catch {
            isClosed = true;
          }
        };

        // 1. Initial connection handshake
        safeEnqueue(
          `event: connected\ndata: ${JSON.stringify({
            username: user.username,
            role: user.role,
            timestamp: new Date().toISOString(),
          })}\n\n`
        );

        // 2. Subscribe to Realtime Event Bus
        const unsubscribe = realtimeEventBus.subscribe(user.username, user.role, (event) => {
          safeEnqueue(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
        });

        // 3. Heartbeat keepalive ping every 20 seconds
        const pingInterval = setInterval(() => {
          safeEnqueue(`: ping\n\n`);
        }, 20000);

        cleanup = () => {
          isClosed = true;
          clearInterval(pingInterval);
          unsubscribe();
        };

        req.signal.addEventListener('abort', () => {
          if (cleanup) {
            cleanup();
            cleanup = null;
          }
        });
      },
      cancel() {
        if (cleanup) {
          cleanup();
          cleanup = null;
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Content-Encoding': 'none',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    console.error('[SSE_STREAM_ERROR]', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
