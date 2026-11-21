// 后台图片上传：Route Handler 而不是 Server Action，
// 因为要收 multipart 的二进制，Server Action 那点体积上限不够用。
// 鉴权走 Cookie 里的管理员会话，不认任何 query 参数。

import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { saveImage } from '@/lib/upload';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ ok: false, error: '未登录' }, { status: 401 });

  const len = Number(req.headers.get('content-length') ?? 0);
  if (len > 15 * 1024 * 1024) {
    return Response.json({ ok: false, error: '请求太大了' }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ ok: false, error: '表单解析失败' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: '字段名要是 file' }, { status: 400 });
  }

  const result = await saveImage(file);
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
