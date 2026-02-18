import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { getChecklistSlugs, getChecklistContent } from "@/lib/docs";
import DocView from "../../DocView";

export default async function ChecklistDocPage({ params }: { params: { slug: string } }) {
  await requireAdmin();
  const slug = decodeURIComponent(params.slug);
  const content = getChecklistContent(slug);
  const list = getChecklistSlugs();
  const meta = list.find((s) => s.slug === slug);
  const idx = list.findIndex((s) => s.slug === slug);

  if (!content) notFound();

  const prevDoc = idx > 0
    ? { href: `/admin/docs/checklists/${encodeURIComponent(list[idx - 1].slug)}`, label: list[idx - 1].title }
    : null;
  const nextDoc = idx >= 0 && idx < list.length - 1
    ? { href: `/admin/docs/checklists/${encodeURIComponent(list[idx + 1].slug)}`, label: list[idx + 1].title }
    : null;

  return (
    <DocView
      title={meta?.title ?? slug}
      subtitle="Checklist"
      content={content}
      backHref="/admin/docs"
      prevDoc={prevDoc}
      nextDoc={nextDoc}
    />
  );
}
