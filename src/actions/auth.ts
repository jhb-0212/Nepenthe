'use server';

import { redirect } from 'next/navigation';
import { clearSessionCookie, clientIp, login, setSessionCookie } from '@/lib/auth';
import { getDashboard } from '@/lib/content';
import { reindexAll } from '@/lib/search';
import { prisma } from '@/lib/prisma';

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const username = String(form.get('username') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (!username || !password) return { error: '账号和口令都要填' };

  const result = await login(username, password, await clientIp());
  if (!result.ok) return { error: result.reason };

  await setSessionCookie(result.token);
  redirect('/admin');
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect('/admin/login');
}

/** 发布：不再跑 npm build，改内容即时生效；这里做三件事——建任务、重建索引、失效缓存 */
export async function publishAction(): Promise<{ ok: boolean; jobId: number; message: string }> {
  const job = await prisma.publishJob.create({
    data: { status: 'running', step: '重建索引', progress: 10 },
  });

  try {
    const result = await reindexAll();
    await prisma.publishJob.update({
      where: { id: job.id },
      data: {
        status: 'success',
        step: '已生效',
        progress: 100,
        log: `索引文档 ${result.count} 条${result.ok ? '（Meilisearch）' : '（Postgres 兜底）'}`,
        finishedAt: new Date(),
      },
    });
  } catch (e) {
    await prisma.publishJob.update({
      where: { id: job.id },
      data: { status: 'failed', step: '失败', progress: 100, log: (e as Error).message, finishedAt: new Date() },
    });
    return { ok: false, jobId: job.id, message: '发布失败，看日志' };
  }

  // 页面是 force-dynamic，不需要 revalidate；这里保留调用是为了以后加 ISR 时不用改调用方
  return { ok: true, jobId: job.id, message: '已发布，前台即时生效' };
}

export async function dashboardAction() {
  return getDashboard();
}
