import { notFound } from 'next/navigation';
import { guard } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import NoteEditor from '@/components/NoteEditor';

export const metadata = { title: '编辑随记' };

type Props = { params: Promise<{ id: string }> };

export default async function EditNotePage({ params }: Props) {
  await guard();
  const { id } = await params;

  if (id === 'new') {
    return (
      <div className="admin-shell">
        <div className="admin-top">
          <h1>新随记</h1>
        </div>
        <NoteEditor note={null} />
      </div>
    );
  }

  const note = await prisma.note.findUnique({ where: { id: Number(id) } });
  if (!note) notFound();

  return (
    <div className="admin-shell">
      <div className="admin-top">
        <h1>编辑随记</h1>
        <small>{note.slug}</small>
      </div>
      <NoteEditor
        note={{
          id: note.id,
          slug: note.slug,
          body: note.body,
          tag: note.tag,
          date: note.date.toISOString().slice(0, 10),
          draft: note.draft,
        }}
      />
    </div>
  );
}
