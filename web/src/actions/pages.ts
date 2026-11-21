'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { normalizePages, PAGE_KEYS } from '@/lib/pages';

export type PagesState = { ok?: boolean; error?: string; message?: string };

export async function savePages(_prev: PagesState, form: FormData): Promise<PagesState> {
  await requireAdmin();

  let parsed: unknown;
  try {
    parsed = JSON.parse(String(form.get('payload') ?? '{}'));
  } catch {
    return { error: '数据解析失败，刷新后重试' };
  }

  const pages = normalizePages(parsed);

  if (!pages.writing.title.trim()) return { error: '文章页标题不能空' };

  try {
    await prisma.siteSetting.upsert({
      where: { key: 'pages' },
      create: { key: 'pages', value: pages as unknown as object },
      update: { value: pages as unknown as object },
    });
  } catch {
    return { error: '写库失败，看下数据库是否在跑' };
  }

  for (const [key] of PAGE_KEYS) {
    const path = key === 'writing' ? '/writing' : `/${key}`;
    revalidatePath(path);
  }
  revalidatePath('/admin/pages');

  return { ok: true, message: '存好了，前台刷新即生效' };
}
