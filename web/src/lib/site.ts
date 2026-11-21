import { prisma } from './prisma';

export type TrackConfig = {
  id: string;
  name: string;
  artist: string;
  dur: number;
  why: string;
};

export type DoingConfig = {
  state: string;
  title: string;
  sub: string;
  note: string;
  noteLong: string;
};

export type ContactConfig = {
  github: string;
  email: string;
  wechatId: string;
  wechatQr: string;
  douyin: string;
};

export type SiteConfig = {
  name: string;
  en: string;
  mark: string;
  intro: string;
  lead: string;
  desc: string;
  playlistId: string;
  musicApi: string;
  portfolioUrl: string;
  backgroundImage: string;
  backgroundImageDim: number;
  contact: ContactConfig;
  bio: string[];
  tracks: TrackConfig[];
  doing: DoingConfig[];
  facts: { k: string; v: string }[];
};

// 数据库连不上时的兜底：保证 404、错误页也有一套能看的文案
export const DEFAULT_SITE: SiteConfig = {
  name: '忘忧居',
  en: 'Nepenthe',
  mark: '十一月 · 二〇二六',
  intro: '在做 AIGC，也在写文案。',
  lead:
    '这里只放三样东西：我在听的歌、我写下的字、我此刻在做的事。作品集在另一个入口——那里只有结果，这里允许有过程。',
  desc: '忘忧居 Nepenthe：在做 AIGC，也在写文案。声音、文章、正在做的事，以及作品集入口。',
  playlistId: '',
  musicApi: '/api/music',
  portfolioUrl: '',
  backgroundImage: '',
  backgroundImageDim: 0,
  contact: { github: '', email: '', wechatId: '', wechatQr: '', douyin: '' },
  bio: [],
  tracks: [],
  doing: [],
  facts: [],
};

/** 站点配置：库里有 settings.site 就用库里的，缺字段用默认补齐 */
export async function getSite(): Promise<SiteConfig> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: 'site' } });
    const value = (row?.value ?? {}) as Partial<SiteConfig>;
    return {
      ...DEFAULT_SITE,
      ...value,
      contact: { ...DEFAULT_SITE.contact, ...(value.contact ?? {}) },
      musicApi: value.musicApi || DEFAULT_SITE.musicApi,
      bio: Array.isArray(value.bio) ? value.bio : DEFAULT_SITE.bio,
      tracks: Array.isArray(value.tracks) ? value.tracks : DEFAULT_SITE.tracks,
      doing: Array.isArray(value.doing) ? value.doing : DEFAULT_SITE.doing,
      facts: Array.isArray(value.facts) ? value.facts : DEFAULT_SITE.facts,
    };
  } catch {
    return DEFAULT_SITE;
  }
}

export const siteUrl = () => process.env.PUBLIC_SITE_URL?.replace(/\/$/, '') || 'http://localhost:3100';

/** 填用户名补成完整地址，填完整地址原样用 */
export const isAbsoluteUrl = (v: string) => /^https?:\/\//.test(v);
