import { notFound } from 'next/navigation';
import { guard } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import ChapterEditor from '@/components/ChapterEditor';

export const metadata = { title: '编辑章节' };

type Props = { params: Promise<{ id: string; chapterId: string }> };

export default async function EditChapterPage({ params }: Props) {
  await guard();
  const { id, chapterId } = await params;
  const novelId = Number(id);
  const novel = await prisma.novel.findUnique({ where: { id: novelId }, select: { id: true, title: true, slug: true } });
  if (!novel) notFound();

  const backHref = `/admin/novels/${novel.id}`;

  if (chapterId === 'new') {
    const next = await prisma.chapter.count({ where: { novelId } });
    return (
      <div className="admin-shell">
        <div className="admin-top">
          <h1>新章节</h1>
          <small>{novel.title}</small>
        </div>
        <ChapterEditor
          novelId={novel.id}
          backHref={backHref}
          chapter={{
            id: 0,
            slug: '',
            title: '',
            order: next + 1,
            date: new Date().toISOString().slice(0, 10),
            body: '',
            draft: false,
          }}
        />
      </div>
    );
  }

  const chapter = await prisma.chapter.findUnique({ where: { id: Number(chapterId) } });
  if (!chapter || chapter.novelId !== novel.id) notFound();

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <h1>第 {chapter.order} 章</h1>
        <small>
          {novel.title} · {chapter.slug}
        </small>
      </div>
      <ChapterEditor
        novelId={novel.id}
        backHref={backHref}
        chapter={{
          id: chapter.id,
          slug: chapter.slug,
          title: chapter.title,
          order: chapter.order,
          date: chapter.date.toISOString().slice(0, 10),
          body: chapter.body,
          draft: chapter.draft,
        }}
      />
    </div>
  );
}
