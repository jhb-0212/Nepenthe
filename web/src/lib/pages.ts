import { prisma } from './prisma';

/** 每个前台页面的页头文案：小标签 / 标题 / 一句说明 / 副句 / 空态或页脚小字 */
export type PageCopy = {
  kicker: string;
  title: string;
  lead: string;
  sub: string;
  note: string;
};

export type PagesConfig = {
  writing: PageCopy;
  notes: PageCopy;
  novels: PageCopy;
  gallery: PageCopy;
  galleryBg: string;
  archive: PageCopy;
  music: PageCopy;
  doing: PageCopy;
  wall: PageCopy;
  search: PageCopy;
};

export const DEFAULT_PAGES: PagesConfig = {
  writing: {
    kicker: 'WORDS',
    title: '文章',
    lead: '写得出来的都放这儿。没被采纳的句子、删掉的镜头、半夜推翻的结构，也算。',
    sub: '',
    note: '还没有文章。后台发布第一篇之后，这里就有了。',
  },
  notes: {
    kicker: 'NOTES',
    title: '随记',
    lead: '没长到能写成文章的那些话。一天一句，或者三天一句，想起来就记。',
    sub: '',
    note: '还没有随记。',
  },
  novels: {
    kicker: 'FICTION',
    title: '小说',
    lead: '长的那种。连载中的、筹备中的，都在这儿。',
    sub: '',
    note: '作品会一部一部加。每部里面按章节排，读起来像翻开一本。',
  },
  gallery: {
    kicker: 'GALLERY',
    title: '风月册',
    lead: '所有不经意的遇见，都是光馈赠的散文诗',
    sub: '山野入镜，清风翻页',
    note: '相册还没建。',
  },
  galleryBg: '/hero-bg.jpg',
  archive: {
    kicker: 'ARCHIVE',
    title: '归档',
    lead: '一条河从最早流到今天，越往下越新。文章、随记、小说章节都浮在河上。',
    sub: '',
    note: '还没有能归档的东西。',
  },
  music: {
    kicker: 'SOUND',
    title: '音乐',
    lead: '最近在循环的东西。声音走服务端代理，网易云和 QQ 音乐混着放，歌词跟着唱。',
    sub: '',
    note: '',
  },
  doing: {
    kicker: 'NOW',
    title: '在做',
    lead: '这一页只回答一件事：我把时间花在哪。不写计划，只写正在进行的。',
    sub: '白天写代码和论文，晚上写文案、剪片子。不追求样样精通，但要求每一件拿出来的东西，自己愿意署名。',
    note: '',
  },
  wall: {
    kicker: 'WALL',
    title: '留言墙',
    lead: '不用登录，不用留联系方式。写一句就走 —— 审核过了，它才出现在下面。',
    sub: '',
    note: '墙上还空着。第一句话留给你。',
  },
  search: {
    kicker: 'SEARCH',
    title: '搜索',
    lead: '搜文章、随记、小说的正文。输入两个字就能出结果。',
    sub: '',
    note: '索引在服务端（Meilisearch）实时维护，发布内容后立即可搜；没配 Meilisearch 时退回 PostgreSQL 检索。',
  },
};

export const PAGE_KEYS = [
  ['writing', '文章'],
  ['notes', '随记'],
  ['novels', '小说'],
  ['gallery', '相册'],
  ['archive', '归档'],
  ['music', '音乐'],
  ['doing', '在做'],
  ['wall', '留言'],
  ['search', '搜索'],
] as const;

const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);

function pickPage(raw: unknown, d: PageCopy): PageCopy {
  const o = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    kicker: str(o.kicker, d.kicker),
    title: str(o.title, d.title),
    lead: str(o.lead, d.lead),
    sub: str(o.sub, d.sub),
    note: str(o.note, d.note),
  };
}

/** 库里少一页、某页少字段，都退回默认，前台不会因为配置不全而报错 */
export function normalizePages(input: unknown): PagesConfig {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const d = DEFAULT_PAGES;
  return {
    writing: pickPage(o.writing, d.writing),
    notes: pickPage(o.notes, d.notes),
    novels: pickPage(o.novels, d.novels),
    gallery: pickPage(o.gallery, d.gallery),
    galleryBg: str(o.galleryBg, d.galleryBg),
    archive: pickPage(o.archive, d.archive),
    music: pickPage(o.music, d.music),
    doing: pickPage(o.doing, d.doing),
    wall: pickPage(o.wall, d.wall),
    search: pickPage(o.search, d.search),
  };
}

export async function getPages(): Promise<PagesConfig> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: 'pages' } });
    if (!row) return DEFAULT_PAGES;
    return normalizePages(row.value);
  } catch {
    return DEFAULT_PAGES;
  }
}
