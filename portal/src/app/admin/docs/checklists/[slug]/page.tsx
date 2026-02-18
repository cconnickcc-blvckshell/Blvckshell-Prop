import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { getChecklistSlugs, getChecklistContent } from "@/lib/docs";
import DocView from "../../DocView";

export default async function ChecklistDocPage({ params }: { params: { slug: string } }) {
  await requireAdmin();
  const slug = decodeURIComponent(params.slug);
  const content = getChecklistContent(slug);
  const slugs = getChecklistSlugs();
  const meta = slugs.find((s) => s.slug === slug);

  if (!content) notFound();

  return (
    <DocView
      title={meta?.title ?? slug}
      subtitle="Checklist"
      content={content}
      backHref="/admin/docs"
    />
  );
}
