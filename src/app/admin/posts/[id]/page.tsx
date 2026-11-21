import { notFound } from 'next/navigation';
import { guard } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import PostEditor from '@/components/PostEditor';
import VersionPanel from '@/components/VersionPanel';

export const metadata = { title: '编辑文章' };

type Props = { params: Promise<{ id: string }> };

export default async function EditPostPage({ params }: Props) {
  await guard();
  const { id } = await params;

  if (id === 'new') {
    return (
      <div className="admin-shell">
        <div className="admin-top">
          <h1>新文章</h1>
        </div>
        <PostEditor post={null} />
      </div>
    );
  }

  const post = await prisma.post.findUnique({ where: { id: Number(id) } });
  if (!post) notFound();

  const versions = await prisma.contentVersion.findMany({
    where: { contentType: 'post', contentId: post.id },
    orderBy: { createdAt: 'desc' },
    take: 12,
    select: { id: true, title: true, body: true, createdAt: true },
  });

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <h1>编辑</h1>
        <small>{post.slug}</small>
      </div>
      <PostEditor
        post={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          tag: post.tag,
          readTime: post.readTime,
          summary: post.summary,
          body: post.body,
          date: post.date.toISOString().slice(0, 10),
          draft: post.draft,
        }}
      />
      <VersionPanel postId={post.id} versions={versions} />
    </div>
  );
}
