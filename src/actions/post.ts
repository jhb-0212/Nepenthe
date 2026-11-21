'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/slug';

export type SaveState = { ok?: boolean; error?: string; message?: string };

type PostSnapshot = {
  id?: number;
  title?: string;
  slug?: string;
  body?: string;
  tag?: string;
  summary?: string;
  readTime?: string;
  date?: string;
  draft?: boolean;
};

/** 保存文章：先把旧版本存快照，再覆盖 —— 误删误改能找回来 */
export async function savePost(_prev: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin();

  const id = Number(form.get('id') ?? 0);
  const title = String(form.get('title') ?? '').trim();
  const slug = slugify(String(form.get('slug') ?? '') || title);
  const body = String(form.get('body') ?? '');
  const tag = String(form.get('tag') ?? '').trim();
  const summary = String(form.get('summary') ?? '').trim();
  const readTime = String(form.get('readTime') ?? '').trim();
  const dateText = String(form.get('date') ?? '');
  const draft = form.get('draft') === 'on';

  if (!title) return { error: '标题不能空' };
  if (!/^[a-z0-9][a-z0-9-]{0,118}$/.test(slug)) return { error: 'slug 只能是小写字母、数字、短横线' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return { error: '日期格式要 YYYY-MM-DD' };

  const date = new Date(`${dateText}T00:00:00.000Z`);

  try {
    if (id) {
      const old = await prisma.post.findUnique({ where: { id } });
      if (!old) return { error: '文章不存在' };
      await prisma.$transaction([
        prisma.contentVersion.create({
          data: {
            contentType: 'post',
            contentId: id,
            title: old.title,
            body: old.body,
            snapshot: JSON.parse(JSON.stringify(old)),
          },
        }),
        prisma.post.update({
          where: { id },
          data: { title, slug, body, tag, summary, readTime, date, draft },
        }),
      ]);
    } else {
      await prisma.post.create({ data: { title, slug, body, tag, summary, readTime, date, draft } });
    }
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('Unique constraint')) return { error: '这个 slug 已经有文章占用了' };
    return { error: `保存失败：${msg}` };
  }

  revalidatePath('/writing');
  revalidatePath(`/writing/${slug}`);
  revalidatePath('/');
  revalidatePath('/archive');
  return { ok: true, message: '已保存' };
}

/** 回滚到某个历史版本：先把当前状态再存一份快照，再覆盖回去 */
export async function restoreVersion(formData: FormData) {
  await requireAdmin();

  const versionId = Number(formData.get('versionId') ?? 0);
  if (!versionId) return;

  const version = await prisma.contentVersion.findUnique({ where: { id: versionId } });
  if (!version || version.contentType !== 'post') return;

  const snap = version.snapshot as PostSnapshot;
  const targetId = version.contentId;

  const data = {
    title: snap.title ?? version.title ?? '未命名',
    slug: snap.slug ?? slugify(snap.title ?? version.title ?? ''),
    body: snap.body ?? version.body ?? '',
    tag: snap.tag ?? '',
    summary: snap.summary ?? '',
    readTime: snap.readTime ?? '',
    date: snap.date ? new Date(snap.date) : new Date(),
    draft: snap.draft ?? false,
  };

  const current = await prisma.post.findUnique({ where: { id: targetId } });

  if (current) {
    await prisma.$transaction([
      prisma.contentVersion.create({
        data: {
          contentType: 'post',
          contentId: targetId,
          title: current.title,
          body: current.body,
          snapshot: JSON.parse(JSON.stringify(current)),
        },
      }),
      prisma.post.update({ where: { id: targetId }, data }),
    ]);
  } else {
    // 文章已被删掉，从快照重建（slug 可能已被占用，冲突就让用户自己改）
    await prisma.post.create({ data });
  }

  revalidatePath('/writing');
  revalidatePath(`/writing/${data.slug}`);
  revalidatePath('/');
  revalidatePath('/archive');
  redirect(`/admin/posts/${targetId}`);
}

export async function deletePost(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id') ?? 0);
  if (!id) return;
  const old = await prisma.post.findUnique({ where: { id } });
  if (old) {
    await prisma.$transaction([
      prisma.contentVersion.create({
        data: { contentType: 'post', contentId: id, title: old.title, body: old.body, snapshot: JSON.parse(JSON.stringify(old)) },
      }),
      prisma.post.delete({ where: { id } }),
    ]);
  }
  revalidatePath('/writing');
  revalidatePath('/');
  revalidatePath('/archive');
}
