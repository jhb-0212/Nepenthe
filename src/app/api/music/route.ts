// 音乐代理：网易云 + QQ 音乐双源，流式转发音频，支持 Range
//
// 曲目 id 有两种形态：
//   纯数字            → 网易云歌曲 id（如 7072290）
//   字母数字混排      → QQ 音乐 songmid（如 001if23h0TDFmD）
// 也就是说同一个站点可以混着放两家的歌，前端按 id 形态自动选源。
//
// 歌词两家都不需要登录：网易云走 public 的 lyric 接口，QQ 走 c.y.qq.com 的 fcg_query_lyric_new。
// 播放地址则不同：网易云没 cookie 时退到公共 Meting 的试听；QQ 必须有 VIP cookie（QQ_COOKIE）才会返回完整地址，
// 没配就明确报错，不去猜。
//
// id 只认字母数字，避免被当成任意 URL 转发器。

import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const METING = 'https://api.injahow.cn/meting/';
const ID_RE = /^[A-Za-z0-9]{1,32}$/;
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const RATE = 60;
const buckets = new Map<string, number[]>();

type Provider = 'netease' | 'qq';

function providerOf(id: string): Provider {
  return /^\d+$/.test(id) ? 'netease' : 'qq';
}

/** QQ 音乐 cookie 里的 uin 可能是 o123456 这种带前缀的写法，vkey 接口要纯数字的 uin */
function qqUin(cookie: string): string {
  const m = cookie.match(/uin=(?:o)?(\d+)/) || cookie.match(/wxuin=(?:o)?(\d+)/);
  return m?.[1] ?? '0';
}

function decodeEntities(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function neteaseLyric(id: string): Promise<string> {
  try {
    const res = await fetch(`https://music.163.com/api/song/lyric?id=${id}&lv=1&kv=1&tv=-1`, {
      headers: { 'User-Agent': UA, Referer: 'https://music.163.com/' },
      cache: 'no-store',
    });
    const data = (await res.json()) as { lrc?: { lyric?: string } };
    const text = data?.lrc?.lyric || '';
    if (text.trim()) return text;
  } catch {
    /* 落到 Meting */
  }

  try {
    const mt = await fetch(`${METING}?server=netease&type=lrc&id=${id}`, { cache: 'no-store' });
    const data = (await mt.json()) as { lrc?: string | { lrc?: string } };
    return (typeof data.lrc === 'string' ? data.lrc : data.lrc?.lrc) || '';
  } catch {
    return '';
  }
}

async function qqLyric(mid: string): Promise<string> {
  try {
    const res = await fetch(
      `https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${mid}&format=json&nobase64=1&g_tk=5381`,
      {
        headers: { 'User-Agent': UA, Referer: 'https://y.qq.com/' },
        cache: 'no-store',
      },
    );
    const data = (await res.json()) as { lyric?: string };
    return decodeEntities(data?.lyric || '');
  } catch {
    return '';
  }
}

async function qqSongUrl(mid: string, cookie: string): Promise<{ url: string; error?: string }> {
  if (!cookie) {
    return { url: '', error: 'QQ 音乐播放需要 VIP cookie：在 .env 里填 QQ_COOKIE' };
  }

  const payload = {
    req_0: {
      module: 'vkey.GetVkeyServer',
      method: 'CgiGetVkey',
      param: {
        guid: '10000',
        songmid: [mid],
        songtype: [0],
        uin: qqUin(cookie),
        loginflag: 1,
        platform: '20',
      },
    },
  };

  const res = await fetch(`https://u.y.qq.com/cgi-bin/musicu.fcg?format=json&data=${encodeURIComponent(JSON.stringify(payload))}`, {
    headers: { 'User-Agent': UA, Referer: 'https://y.qq.com/', Cookie: cookie },
    cache: 'no-store',
  });
  const data = (await res.json()) as {
    req_0?: {
      data?: {
        sip?: string[];
        midurlinfo?: { purl?: string; result?: number; errtype?: string }[];
      };
    };
  };

  const info = data?.req_0?.data?.midurlinfo?.[0];
  const purl = info?.purl || '';
  if (!purl) {
    const code = info?.result;
    return {
      url: '',
      error:
        code === 104003
          ? 'QQ 音乐的 cookie 没被识别（可能过期了），重新从浏览器复制一份'
          : `QQ 音乐没给播放地址（result=${code ?? '?'}）`,
    };
  }

  const sip = data?.req_0?.data?.sip ?? [];
  const base = sip.find((s) => s.startsWith('https://')) || 'https://dl.stream.qqmusic.qq.com/';
  return { url: base.endsWith('/') ? `${base}${purl}` : `${base}/${purl}` };
}

async function neteaseSongUrl(id: string, cookie: string): Promise<string> {
  if (cookie) {
    try {
      const res = await fetch(`https://music.163.com/api/song/enhance/player/url?ids=[${id}]&br=999000`, {
        headers: { Cookie: cookie, 'User-Agent': UA, Referer: 'https://music.163.com/' },
        cache: 'no-store',
      });
      const data = (await res.json()) as { data?: { url?: string }[] };
      const url = data?.data?.[0]?.url || '';
      if (url) return url;
    } catch {
      /* 落到 Meting */
    }
  }
  try {
    const mt = await fetch(`${METING}?server=netease&type=url&id=${id}`, { cache: 'no-store' });
    const ctype = mt.headers.get('content-type') || '';
    if (ctype.includes('application/json')) {
      const json = (await mt.json()) as { url?: string };
      return json.url || '';
    }
  } catch {
    /* ignore */
  }
  return '';
}

// 没配 cookie 时的试听来源：Apple 的公开 30 秒试听片段（合法、免登录、稳定）
// 中文歌在大陆区目录里常常搜不到，所以按 港 → 台 → 美 的顺序退
const previewCache = new Map<string, { url: string; at: number }>();
const PREVIEW_TTL = 6 * 60 * 60 * 1000;

async function itunesPreview(id: string, name: string, artist: string): Promise<string> {
  const hit = previewCache.get(id);
  if (hit && Date.now() - hit.at < PREVIEW_TTL) return hit.url;

  const term = `${artist} ${name}`.trim();
  if (!term) return '';

  for (const country of ['hk', 'tw', 'us']) {
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&country=${country}&entity=song&limit=5`,
        { headers: { 'User-Agent': UA }, cache: 'no-store' },
      );
      const data = (await res.json()) as { results?: { previewUrl?: string }[] };
      const found = (data.results ?? []).find((r) => r.previewUrl);
      if (found?.previewUrl) {
        previewCache.set(id, { url: found.previewUrl, at: Date.now() });
        return found.previewUrl;
      }
    } catch {
      /* 换下一个区 */
    }
  }
  return '';
}

function stream(upstream: Response, fallbackType = 'audio/mpeg'): Response {  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') || fallbackType,
      'Content-Length': upstream.headers.get('content-length') || '',
      'Content-Range': upstream.headers.get('content-range') || '',
      'Accept-Ranges': 'bytes',
      'Content-Disposition': 'inline',
      'Cache-Control': 'public, max-age=600',
    },
  });
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') ?? '';
  const id = req.nextUrl.searchParams.get('id') ?? '';
  if (!ID_RE.test(id)) return Response.json({ error: 'id 只能是字母数字' }, { status: 400 });

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const now = Date.now();
  const bucket = (buckets.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (bucket.length >= RATE) {
    buckets.set(ip, bucket);
    return Response.json({ error: '请求太频繁，稍后再试' }, { status: 429 });
  }
  bucket.push(now);
  buckets.set(ip, bucket);

  const provider: Provider = providerOf(id);

  try {
    if (type === 'lrc') {
      const text = provider === 'qq' ? await qqLyric(id) : await neteaseLyric(id);
      return new Response(text, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
      });
    }

    if (type === 'url') {
      const cookie = (provider === 'qq' ? process.env.QQ_COOKIE : process.env.NETEASE_COOKIE) || '';
      const name = req.nextUrl.searchParams.get('name') || '';
      const artist = req.nextUrl.searchParams.get('artist') || '';
      let songUrl = '';
      let why = '';

      // 配了 cookie 就先试完整音频；拿不到（或压根没配）就退到 30 秒试听
      if (cookie) {
        if (provider === 'qq') {
          const got = await qqSongUrl(id, cookie);
          songUrl = got.url;
          why = got.error ?? '';
        } else {
          songUrl = await neteaseSongUrl(id, cookie);
        }
      }

      if (!songUrl) {
        const preview = await itunesPreview(id, name, artist);
        if (preview) {
          songUrl = preview;
          why = '';
        }
      }

      if (!songUrl) {
        return Response.json({ error: why || '这首既没有完整音频，也没找到试听片段', url: '' });
      }

      const range = req.headers.get('range');
      const upstream = await fetch(songUrl, {
        headers: {
          'User-Agent': UA,
          Referer: provider === 'qq' ? 'https://y.qq.com/' : 'https://music.163.com/',
          ...(range ? { Range: range } : {}),
        },
        cache: 'no-store',
      });

      if (!upstream.ok || !upstream.body) {
        return Response.json({ error: `音频源返回 ${upstream.status}`, url: '' });
      }
      return stream(upstream);
    }

    if (type === 'song' || type === 'playlist') {
      // 歌单/单曲元信息只有网易云走 Meting；QQ 的曲目信息由后台手填
      if (provider === 'qq') return Response.json({ error: 'QQ 曲目不取歌单信息，直接在后台填' }, { status: 200 });
      const res = await fetch(`${METING}?server=netease&type=${type}&id=${id}`, { cache: 'no-store' });
      const json = await res.json();
      return Response.json(json, { headers: { 'Cache-Control': 'public, max-age=300' } });
    }

    return Response.json({ error: `未知类型: ${type}` }, { status: 400 });
  } catch (e) {
    return Response.json({ error: `请求失败: ${(e as Error).message}`, url: '' }, { status: 200 });
  }
}
