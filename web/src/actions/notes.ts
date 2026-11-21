'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/slug';

export type NoteState = { ok?: boolean; error?: string; message?: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function saveNote(_prev: NoteState, form: FormData): Promise<NoteState> {
  await requireAdmin();

  const id = Number(form.get('id') ?? 0);
  const body = String(form.get('body') ?? '').trim();
  const tag = String(form.get('tag') ?? '').trim();
  const dateText = String(form.get('date') ?? '');
  const draft = form.get('draft') === 'on';
  const slugInput = String(form.get('slug') ?? '').trim();

  if (!body) return { error: '随记不能是空的' };
  if (body.length > 2000) return { error: '随记 2000 字以内' };
  if (!DATE_RE.test(dateText)) return { error: '日期要 YYYY-MM-DD' };

  const date = new Date(`${dateText}T00:00:00.000Z`);
  const slug = slugify(slugInput || `${dateText}-${body.slice(0, 12)}`);

  try {
    if (id) {
      const old = await prisma.note.findUnique({ where: { id } });
      if (!old) return { error: '这条随记不存在' };
      await prisma.$transaction([
        prisma.contentVersion.create({
          data: {
            contentType: 'note',
            contentId: id,
            title: body.slice(0, 40),
            body: old.body,
            snapshot: JSON.parse(JSON.stringify(old)),
          },
        }),
        prisma.note.update({ where: { id }, data: { slug, body, tag: tag || null, date, draft } }),
      ]);
    } else {
      await prisma.note.create({ data: { slug, body, tag: tag || null, date, draft } });
    }
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('Unique constraint')) return { error: 'slug 撞车了，换一个' };
    return { error: `保存失败：${msg}` };
  }

  revalidatePath('/notes');
  revalidatePath('/');
  revalidatePath('/archive');
  return { ok: true, message: '已保存' };
}

export async function deleteNote(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id') ?? 0);
  if (!id) return;
  const old = await prisma.note.findUnique({ where: { id } });
  if (!old) return;
  await prisma.$transaction([
    prisma.contentVersion.create({
      data: { contentType: 'note', contentId: id, title: old.body.slice(0, 40), body: old.body, snapshot: JSON.parse(JSON.stringify(old)) },
    }),
    prisma.note.delete({ where: { id } }),
  ]);
  revalidatePath('/notes');
  revalidatePath('/');
  revalidatePath('/archive');
}
