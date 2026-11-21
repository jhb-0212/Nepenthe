'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { COPY_FIELDS, getCopy, type CopyValues } from '@/lib/copy';

export type CopyState = { ok?: boolean; error?: string; message?: string };

export async function saveCopy(_prev: CopyState, form: FormData): Promise<CopyState> {
  await requireAdmin();

  const values: CopyValues = {};
  for (const f of COPY_FIELDS) {
    const v = form.get(f.key);
    if (typeof v === 'string') values[f.key] = v;
  }

  // 只校验「必填」的那几个：标题空了前台会很难看
  if (!values['writing.title']?.trim()) return { error: '文章页标题不能空' };
  if (!values['notes.title']?.trim()) return { error: '随记页标题不能空' };

  try {
    await prisma.siteSetting.upsert({
      where: { key: 'copy' },
      create: { key: 'copy', value: values as unknown as object },
      update: { value: values as unknown as object },
    });
  } catch {
    return { error: '写库失败，看下数据库是否在跑' };
  }

  for (const p of ['/', '/writing', '/notes', '/novels', '/gallery', '/doing', '/wall', '/archive', '/music', '/search']) {
    revalidatePath(p);
  }
  revalidatePath('/admin/copy');

  const before = await getCopy();
  const changed = COPY_FIELDS.filter((f) => (before[f.key] ?? '') !== (values[f.key] ?? '')).length;

  return { ok: true, message: `存好了，${changed ? `${changed} 个字段有改动，` : ''}前台刷新即生效` };
}
