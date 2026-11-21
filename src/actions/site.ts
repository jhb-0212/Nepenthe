'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { getSite, type SiteConfig, type FeaturedProject } from '@/lib/site';

export type SiteState = { ok?: boolean; error?: string; message?: string };

/** 数组型字段（简介/在做/事实）用 JSON 文本框编辑，解析失败就报错、不写库 */
function parseJsonArray(raw: string, label: string): { ok: true; value: unknown[] } | { ok: false; error: string } {
  const text = raw.trim();
  if (!text) return { ok: true, value: [] };
  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) return { ok: false, error: `${label} 要是一个 JSON 数组` };
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, error: `${label} 的 JSON 解析失败` };
  }
}

export async function saveSite(_prev: SiteState, form: FormData): Promise<SiteState> {
  await requireAdmin();

  const current = await getSite();

  const name = String(form.get('name') ?? '').trim();
  const en = String(form.get('en') ?? '').trim();
  const mark = String(form.get('mark') ?? '').trim();
  const intro = String(form.get('intro') ?? '').trim();
  const lead = String(form.get('lead') ?? '').trim();
  const desc = String(form.get('desc') ?? '').trim();
  const playlistId = String(form.get('playlistId') ?? '').trim();
  const portfolioUrl = String(form.get('portfolioUrl') ?? '').trim();
  const backgroundImage = String(form.get('backgroundImage') ?? '').trim();
  const dimRaw = String(form.get('backgroundImageDim') ?? '0');
  const backgroundImageDim = Number(dimRaw);

  if (!name) return { error: '站点名不能空' };
  if (!Number.isFinite(backgroundImageDim) || backgroundImageDim < 0 || backgroundImageDim > 100) {
    return { error: '背景压暗值填 0–100' };
  }

  const bio = parseJsonArray(String(form.get('bio') ?? ''), '个人简介');
  if (!bio.ok) return { error: bio.error };
  const doing = parseJsonArray(String(form.get('doing') ?? ''), '在做的事');
  if (!doing.ok) return { error: doing.error };
  const facts = parseJsonArray(String(form.get('facts') ?? ''), '数字卡片');
  if (!facts.ok) return { error: facts.error };
  const featuredRaw = parseJsonArray(String(form.get('featuredProjects') ?? ''), '精选作品');
  if (!featuredRaw.ok) return { error: featuredRaw.error };

  // 精选作品逐条校验：标题必填，链接只允许站内路径或 https 绝对地址
  const featuredProjects: FeaturedProject[] = [];
  for (const [i, item] of featuredRaw.value.entries()) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { error: `精选作品第 ${i + 1} 条要是一个对象` };
    }
    const row = item as Partial<FeaturedProject>;
    const title = String(row.title ?? '').trim();
    const summary = String(row.summary ?? '').trim();
    const category = String(row.category ?? '').trim();
    const cover = String(row.cover ?? '').trim();
    const href = String(row.href ?? '').trim();
    const tags = Array.isArray(row.tags) ? row.tags.map((t) => String(t).trim()).filter(Boolean) : [];
    if (!title) return { error: `精选作品第 ${i + 1} 条缺标题` };
    if (!href) return { error: `精选作品第 ${i + 1} 条缺链接` };
    if (!/^\/(?!\/)/.test(href) && !/^https:\/\/|^http:\/\//.test(href)) {
      return { error: `精选作品第 ${i + 1} 条链接要是 / 开头的站内路径或 http(s) 地址` };
    }
    if (cover && !/^\/(?!\/)/.test(cover) && !/^https:\/\/|^http:\/\//.test(cover)) {
      return { error: `精选作品第 ${i + 1} 条封面要是 / 开头的站内路径或 http(s) 地址` };
    }
    featuredProjects.push({
      title,
      summary,
      category,
      cover,
      href,
      tags,
      featured: Boolean(row.featured),
      sort: Number.isFinite(Number(row.sort)) ? Number(row.sort) : i,
    });
  }

  const next: SiteConfig = {
    ...current,
    name,
    en,
    mark,
    intro,
    lead,
    desc,
    playlistId,
    portfolioUrl,
    backgroundImage,
    backgroundImageDim,
    contact: {
      github: String(form.get('github') ?? '').trim(),
      email: String(form.get('email') ?? '').trim(),
      wechatId: String(form.get('wechatId') ?? '').trim(),
      wechatQr: String(form.get('wechatQr') ?? '').trim(),
      douyin: String(form.get('douyin') ?? '').trim(),
    },
    bio: bio.value as string[],
    doing: doing.value as SiteConfig['doing'],
    facts: facts.value as SiteConfig['facts'],
    featuredProjects,
  };

  await prisma.siteSetting.upsert({
    where: { key: 'site' },
    create: { key: 'site', value: JSON.parse(JSON.stringify(next)) },
    update: { value: JSON.parse(JSON.stringify(next)) },
  });

  revalidatePath('/', 'layout');
  return { ok: true, message: '已保存，刷新前台即可看到' };
}
