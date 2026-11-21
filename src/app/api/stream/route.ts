// SSE：每 3 秒推一次「最近 5 分钟谁在读什么」的聚合快照
// 前台 EventSource 自动重连，服务端断开时清理定时器，不泄漏

import { recentReaders } from '@/lib/visit';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          closed = true;
        }
      };

      const tick = async () => {
        try {
          send('presence', await recentReaders());
        } catch {
          send('presence', { at: Date.now(), total: 0, paths: [] });
        }
      };

      // 先发一条心跳注释，避免代理层把连接当成空闲
      controller.enqueue(encoder.encode(': connected\n\n'));
      void tick();
      const timer = setInterval(tick, 3000);

      const stop = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      };

      req.signal.addEventListener('abort', stop);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
