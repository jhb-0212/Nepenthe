'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export type TrackState = { ok?: boolean; error?: string; message?: string };

export async function saveTrack(_prev: TrackState, form: FormData): Promise<TrackState> {
  await requireAdmin();

  const id = Number(form.get('id') ?? 0);
  const songId = String(form.get('songId') ?? '').trim();
  const name = String(form.get('name') ?? '').trim();
  const artist = String(form.get('artist') ?? '').trim();
  const dur = Number(form.get('dur') ?? 0);
  const why = String(form.get('why') ?? '').trim();
  const sort = Number(form.get('sort') ?? 0);

  if (!/^[A-Za-z0-9]{1,32}$/.test(songId)) return { error: '歌曲 ID 只能是字母数字：网易云填纯数字，QQ 音乐填 songmid' };
  if (!name) return { error: '歌名不能空' };
  if (!Number.isFinite(dur) || dur < 0 || dur > 36000) return { error: '时长按秒填，0–36000' };

  if (id) {
    await prisma.track.update({ where: { id }, data: { songId, name, artist, dur, why, sort } });
  } else {
    await prisma.track.create({ data: { songId, name, artist, dur, why, sort } });
  }

  revalidatePath('/music');
  revalidatePath('/admin/music');
  return { ok: true, message: '已保存' };
}

export async function deleteTrack(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id') ?? 0);
  if (!id) return;
  await prisma.track.delete({ where: { id } });
  revalidatePath('/music');
  revalidatePath('/admin/music');
}
