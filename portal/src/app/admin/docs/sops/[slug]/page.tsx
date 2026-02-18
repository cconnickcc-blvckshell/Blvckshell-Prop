import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/guards/rbac";
import { getSopSlugs, getSopContent } from "@/lib/docs";
import DocView from "../../DocView";

export default async function SopDocPage({ params }: { params: { slug: string } }) {
  await requireAdmin();
  const slug = decodeURIComponent(params.slug);
  const content = getSopContent(slug);
  const slugs = getSopSlugs();
  const meta = slugs.find((s) => s.slug === slug);

  if (!content) notFound();

  return (
    <DocView
      title={meta?.title ?? slug}
      subtitle="SOP"
      content={content}
      backHref="/admin/docs"
    />
  );
}
