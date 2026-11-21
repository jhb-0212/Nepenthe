// 图片上传的落盘与清洗。
// 对齐旧站 imaging.py 的做法：校验格式 → 去掉元数据 → 限制尺寸 → 重编码。
// 不存原图：一是隐私（手机照片带 GPS），二是体积。
// 一律转 WebP，长边 ≤ 2560，质量为 88，肉眼基本无损。

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import type { Metadata } from 'sharp';

const MAX_BYTES = 12 * 1024 * 1024; // 单张 12MB
const MAX_PIXELS = 40_000_000; // 4000 万像素，挡解压炸弹
const MAX_SIDE = 2560;
const QUALITY = 88;
const ALLOWED = new Set(['jpeg', 'png', 'webp', 'gif', 'avif', 'tiff']);

export type UploadOk = { ok: true; url: string; width: number; height: number; bytes: number };
export type UploadErr = { ok: false; error: string };
export type UploadResult = UploadOk | UploadErr;

/** 图片写 public/uploads/YYYYMM/，随容器挂 volume 持久化 */
export const uploadRoot = () => path.join(process.cwd(), 'public', 'uploads');

export async function saveImage(file: File): Promise<UploadResult> {
  if (!file || typeof file === 'string') return { ok: false, error: '没有拿到文件' };
  if (file.size === 0) return { ok: false, error: '文件是空的' };
  if (file.size > MAX_BYTES) return { ok: false, error: `图片超过 ${MAX_BYTES / 1024 / 1024}MB` };

  const buf = Buffer.from(await file.arrayBuffer());

  // sharp 的 metadata 同时完成「是不是图片」和格式识别，不靠后缀
  let meta: Metadata;
  try {
    meta = await sharp(buf, { limitInputPixels: MAX_PIXELS }).metadata();
  } catch {
    return { ok: false, error: '这个文件不是能识别的图片' };
  }
  if (!meta.format || !ALLOWED.has(meta.format)) {
    return { ok: false, error: '只收 JPEG / PNG / WebP / GIF / AVIF / TIFF' };
  }
  if ((meta.width ?? 0) < 2 || (meta.height ?? 0) < 2) return { ok: false, error: '图片尺寸太小' };

  let out: Buffer;
  let info: { width: number; height: number };
  try {
    // rotate() 按 EXIF 方向摆正；重新编码时 EXIF/IPTC/XMP 全部丢弃
    const res = await sharp(buf, { limitInputPixels: MAX_PIXELS })
      .rotate()
      .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: QUALITY, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    out = res.data;
    info = { width: res.info.width, height: res.info.height };
  } catch {
    return { ok: false, error: '图片处理失败，换一张试试' };
  }

  const dirName = new Date().toISOString().slice(0, 7).replace('-', '');
  const dir = path.join(uploadRoot(), dirName);
  const name = `${crypto.randomBytes(10).toString('hex')}.webp`;

  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), out);
  } catch {
    return { ok: false, error: '写盘失败：容器里的 public/uploads 需要挂 volume' };
  }

  return { ok: true, url: `/uploads/${dirName}/${name}`, width: info.width, height: info.height, bytes: out.length };
}
