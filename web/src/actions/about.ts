'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { normalizeAbout } from '@/lib/about';

export type AboutState = { ok?: boolean; error?: string; message?: string };

export async function saveAbout(_prev: AboutState, form: FormData): Promise<AboutState> {
  await requireAdmin();

  let parsed: unknown;
  try {
    parsed = JSON.parse(String(form.get('payload') ?? '{}'));
  } catch {
    return { error: '数据解析失败，刷新后重试' };
  }

  const about = normalizeAbout(parsed);

  if (!about.headline.trim()) return { error: '开篇大标题不能空' };
  if (!about.plays.some((p) => p.name.trim())) return { error: '「玩什么」至少要留一张卡' };

  try {
    await prisma.siteSetting.upsert({
      where: { key: 'about' },
      create: { key: 'about', value: about as unknown as object },
      update: { value: about as unknown as object },
    });
  } catch {
    return { error: '写库失败，看下数据库是否在跑' };
  }

  revalidatePath('/about');
  revalidatePath('/admin/about');
  return { ok: true, message: '存好了，前台 /about 刷新即生效' };
}
