'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/slug';

export type NovelState = { ok?: boolean; error?: string; message?: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function saveNovel(_prev: NovelState, form: FormData): Promise<NovelState> {
  await requireAdmin();

  const id = Number(form.get('id') ?? 0);
  const title = String(form.get('title') ?? '').trim();
  const slugInput = String(form.get('slug') ?? '').trim();
  const subtitle = String(form.get('subtitle') ?? '').trim();
  const summary = String(form.get('summary') ?? '').trim();
  const status = String(form.get('status') ?? '').trim() || '连载中';
  const tags = String(form.get('tags') ?? '')
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);
  const body = String(form.get('body') ?? '');
  const dateText = String(form.get('updated') ?? '');
  const draft = form.get('draft') === 'on';

  if (!title) return { error: '作品要有标题' };
  if (!DATE_RE.test(dateText)) return { error: '日期要 YYYY-MM-DD' };
  const updated = new Date(`${dateText}T00:00:00.000Z`);
  const slug = slugify(slugInput || title);

  try {
    if (id) {
      await prisma.novel.update({
        where: { id },
        data: { slug, title, subtitle: subtitle || null, summary, status, tags, body, updated, draft },
      });
    } else {
      await prisma.novel.create({
        data: { slug, title, subtitle: subtitle || null, summary, status, tags, body, updated, draft },
      });
    }
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('Unique constraint')) return { error: 'slug 已被占用' };
    return { error: `保存失败：${msg}` };
  }

  revalidatePath('/novels');
  revalidatePath(`/novels/${slug}`);
  revalidatePath('/archive');
  return { ok: true, message: '已保存' };
}

export async function deleteNovel(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id') ?? 0);
  if (!id) return;
  // 章节是 onDelete: Cascade，一起走
  await prisma.novel.delete({ where: { id } });
  revalidatePath('/novels');
  revalidatePath('/archive');
}

export async function saveChapter(_prev: NovelState, form: FormData): Promise<NovelState> {
  await requireAdmin();

  const novelId = Number(form.get('novelId') ?? 0);
  const id = Number(form.get('id') ?? 0);
  const title = String(form.get('title') ?? '').trim();
  const slugInput = String(form.get('slug') ?? '').trim();
  const order = Number(form.get('order') ?? 1);
  const dateText = String(form.get('date') ?? '');
  const body = String(form.get('body') ?? '');
  const draft = form.get('draft') === 'on';

  if (!novelId) return { error: '缺少作品' };
  if (!title) return { error: '章节要有标题' };
  if (!DATE_RE.test(dateText)) return { error: '日期要 YYYY-MM-DD' };
  if (!Number.isFinite(order) || order < 1) return { error: '序号要是正整数' };

  const date = new Date(`${dateText}T00:00:00.000Z`);
  const slug = slugify(slugInput || `ch-${String(order).padStart(2, '0')}`);

  try {
    if (id) {
      await prisma.chapter.update({ where: { id }, data: { slug, title, order, date, body, draft } });
    } else {
      await prisma.chapter.create({ data: { novelId, slug, title, order, date, body, draft } });
    }
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('Unique constraint')) return { error: '这部作品里已经有同 slug 的章节' };
    return { error: `保存失败：${msg}` };
  }

  const novel = await prisma.novel.findUnique({ where: { id: novelId }, select: { slug: true } });
  revalidatePath('/novels');
  if (novel) revalidatePath(`/novels/${novel.slug}`);
  revalidatePath('/archive');
  return { ok: true, message: '已保存' };
}

export async function deleteChapter(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id') ?? 0);
  if (!id) return;
  await prisma.chapter.delete({ where: { id } });
  revalidatePath('/novels');
  revalidatePath('/archive');
}
