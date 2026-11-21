import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const jobId = Number(new URL(req.url).searchParams.get('job') ?? 0);
  if (!jobId) return Response.json({ error: 'job 必填' }, { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (data: unknown) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: publish\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const tick = async () => {
        try {
          const job = await prisma.publishJob.findUnique({ where: { id: jobId } });
          if (!job) {
            send({ status: 'failed', step: '任务不存在', progress: 100, log: '' });
            closed = true;
            controller.close();
            return;
          }
          send({ status: job.status, step: job.step, progress: job.progress, log: job.log });
          if (job.status === 'success' || job.status === 'failed') {
            closed = true;
            clearInterval(timer);
            controller.close();
          }
        } catch {
          /* 忽略一次数据库抖动 */
        }
      };

      controller.enqueue(encoder.encode(': connected\n\n'));
      const timer = setInterval(tick, 800);
      void tick();
      req.signal.addEventListener('abort', () => {
        closed = true;
        clearInterval(timer);
        try {
          controller.close();
        } catch {
          /* ignore */
        }
      });
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
