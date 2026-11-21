'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { requireAdmin, clientIp } from '@/lib/auth';
import { todayKey, uaFamily, visitorHash } from '@/lib/visit';

export type MessageState = { ok?: boolean; error?: string; message?: string; body?: string; name?: string };

const MAX_NAME = 12;
const MAX_BODY = 400;
const MIN_BODY = 4;
const MAX_PER_10MIN = 2;
const MAX_PER_DAY = 5;
const MIN_INTERVAL_MS = 60 * 1000;

const URL_RE = /(https?:\/\/|www\.|\.com|\.cn|\.net|\.io|\.top|\.xyz)/i;
const CONTROL_RE = /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g;

const clean = (s: string) => s.replace(CONTROL_RE, '').replace(/\r\n/g, '\n').trim();

/**
 * 匿名留言：不登录也能写。
 * 防刷靠四层，都不需要用户填验证码：
 * 1) 蜜罐字段（真人看不见，bot 会填）
 * 2) 时间闸（渲染到提交不满 3 秒算脚本）
 * 3) 同一 IP 哈希：10 分钟 2 条、24 小时 5 条
 * 4) 内容门槛：长度 4–400、不许带链接
 * 全部通过也只是「入库待审」，前台看不到 —— 人工审核是最后一道。
 */
export async function submitMessage(_prev: MessageState, form: FormData): Promise<MessageState> {
  const name = clean(String(form.get('name') ?? '')).slice(0, MAX_NAME);
  const body = clean(String(form.get('body') ?? ''));
  const honey = String(form.get('website') ?? '');
  const renderedAt = Number(form.get('renderedAt') ?? 0);

  // 蜜罐 / 时间闸：假装成功，不入库，不给 bot 反馈
  if (honey.trim()) return { ok: true, message: '收到，审核通过后会出现在墙上。' };
  if (!renderedAt || Date.now() - renderedAt < 3000) {
    return { ok: true, message: '收到，审核通过后会出现在墙上。' };
  }
  if (Date.now() - renderedAt > 6 * 60 * 60 * 1000) {
    return { error: '页面开太久了，刷新一下再提交。', name, body };
  }

  if (body.length < MIN_BODY) return { error: '再多写几个字吧（至少 4 个字）。', name, body };
  if (body.length > MAX_BODY) return { error: `太长了，${MAX_BODY} 字以内。`, name, body };
  if (URL_RE.test(body) || URL_RE.test(name)) return { error: '墙上不放链接，把网址去掉再发。', name, body };

  const ip = await clientIp();
  const ua = (await headers()).get('user-agent') ?? '';
  const ipHash = visitorHash(ip, ua, todayKey());
  const now = Date.now();

  const [recent, daily, last] = await Promise.all([
    prisma.message.count({ where: { ipHash, createdAt: { gte: new Date(now - 10 * 60 * 1000) } } }),
    prisma.message.count({ where: { ipHash, createdAt: { gte: new Date(now - 24 * 60 * 60 * 1000) } } }),
    prisma.message.findFirst({ where: { ipHash }, orderBy: { createdAt: 'desc' } }),
  ]);

  if (recent >= MAX_PER_10MIN) return { error: '写得有点急，歇十分钟再来。', name, body };
  if (daily >= MAX_PER_DAY) return { error: '今天的额度用完了，明天再聊。', name, body };
  if (last && now - last.createdAt.getTime() < MIN_INTERVAL_MS) {
    return { error: '上一条还在墙上等着，先让它站一会儿。', name, body };
  }

  try {
    await prisma.message.create({
      data: { name, body, ipHash, ua: uaFamily(ua).slice(0, 20) },
    });
  } catch {
    return { error: '没存上，等会儿再试一次。', name, body };
  }

  revalidatePath('/admin/wall');
  return { ok: true, message: '收到，审核通过后会出现在墙上。', body: '' };
}

/** 审核：approve 放行 / hide 下架 / restore 恢复待审 */
export async function moderateMessage(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id') ?? 0);
  const op = String(formData.get('op') ?? '');
  if (!id || !op) return;

  if (op === 'approve') {
    await prisma.message.update({ where: { id }, data: { approved: true, hidden: false } });
  } else if (op === 'hide') {
    await prisma.message.update({ where: { id }, data: { approved: false, hidden: true } });
  } else if (op === 'restore') {
    await prisma.message.update({ where: { id }, data: { hidden: false, approved: false } });
  } else if (op === 'delete') {
    await prisma.message.delete({ where: { id } });
  } else if (op === 'note') {
    const note = clean(String(formData.get('note') ?? '')).slice(0, 200);
    await prisma.message.update({ where: { id }, data: { note } });
  }

  revalidatePath('/admin/wall');
  revalidatePath('/wall');
}
