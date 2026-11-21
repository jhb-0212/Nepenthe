'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/slug';

export type GalleryState = { ok?: boolean; error?: string; message?: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function saveAlbum(_prev: GalleryState, form: FormData): Promise<GalleryState> {
  await requireAdmin();
  const id = Number(form.get('id') ?? 0);
  const title = String(form.get('title') ?? '').trim();
  const slugInput = String(form.get('slug') ?? '').trim();
  const tone = String(form.get('tone') ?? 'mag').trim();
  const note = String(form.get('note') ?? '').trim();
  const sort = Number(form.get('sort') ?? 0);

  if (!title) return { error: '相册要有名字' };
  const slug = slugify(slugInput || title);

  try {
    if (id) await prisma.album.update({ where: { id }, data: { slug, title, tone, note, sort } });
    else await prisma.album.create({ data: { slug, title, tone, note, sort } });
  } catch (e) {
    const msg = (e as Error).message;
    if (msg.includes('Unique constraint')) return { error: 'slug 重复了' };
    return { error: `保存失败：${msg}` };
  }

  revalidatePath('/gallery');
  revalidatePath('/admin/gallery');
  return { ok: true, message: '已保存' };
}

/** 表单直接提交的版本：表单 action 必须返回 void，所以包一层 */
export async function createAlbumForm(form: FormData) {
  await saveAlbum({}, form);
}

export async function deleteAlbum(formData: FormData) {  await requireAdmin();
  const id = Number(formData.get('id') ?? 0);
  if (!id) return;
  await prisma.album.delete({ where: { id } }); // photos 级联删除（只删记录，文件留着）
  revalidatePath('/gallery');
  revalidatePath('/admin/gallery');
}

/** 照片：前端先把图传到 /api/admin/upload，拿到 url 再调这里落记录 */
export async function addPhoto(formData: FormData) {
  await requireAdmin();
  const albumId = Number(formData.get('albumId') ?? 0);
  const src = String(formData.get('src') ?? '').trim();
  const caption = String(formData.get('caption') ?? '').trim().slice(0, 120);
  const dateText = String(formData.get('date') ?? '');
  if (!albumId || !src.startsWith('/uploads/')) return;
  const date = DATE_RE.test(dateText) ? new Date(`${dateText}T00:00:00.000Z`) : new Date();

  await prisma.photo.create({ data: { albumId, src, caption, date, sort: 0 } });
  revalidatePath('/gallery');
  revalidatePath('/admin/gallery');
}

export async function updatePhoto(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id') ?? 0);
  if (!id) return;
  const caption = String(formData.get('caption') ?? '').trim().slice(0, 120);
  const sort = Number(formData.get('sort') ?? 0);
  await prisma.photo.update({ where: { id }, data: { caption, sort } });
  revalidatePath('/gallery');
  revalidatePath('/admin/gallery');
}

export async function deletePhoto(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id') ?? 0);
  if (!id) return;
  await prisma.photo.delete({ where: { id } });
  revalidatePath('/gallery');
  revalidatePath('/admin/gallery');
}
