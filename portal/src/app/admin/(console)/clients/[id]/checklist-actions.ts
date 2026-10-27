"use server";

import { requireAdmin } from "@/server/guards/rbac";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getChecklistContent } from "@/lib/docs";
import { parseChecklistMarkdown } from "@/lib/checklist-parser";

export async function assignChecklistTemplate(formData: FormData) {
  await requireAdmin();
  
  const siteId = formData.get("siteId") as string;
  const checklistId = formData.get("checklistId") as string;
  
  if (!siteId || !checklistId) {
    return { error: "Site ID and checklist ID are required." };
  }
  
  // Get the markdown content for this checklist
  // Map CL_01 -> CL_01_Lobby_Checklist, CL_02 -> CL_02_Hallway_Checklist, etc.
  const checklistSlugMap: Record<string, string> = {
    CL_01: "CL_01_Lobby_Checklist",
    CL_02: "CL_02_Hallway_Checklist",
    CL_03: "CL_03_Stairwell_Checklist",
    CL_04: "CL_04_Elevator_Checklist",
    CL_05: "CL_05_Garbage_Room_Checklist",
    CL_06: "CL_06_Glass_Doors_Spot_Checklist",
    CL_07: "CL_07_Washroom_Common_Area_Checklist",
    CL_08: "CL_08_Seasonal_Deep_Clean_Checklist",
  };
  
  const slug = checklistSlugMap[checklistId] || checklistId;
  const content = getChecklistContent(slug);
  
  if (!content) {
    return { error: `Checklist ${checklistId} not found in documentation.` };
  }
  
  // Parse the markdown into items
  const parsed = parseChecklistMarkdown(content, checklistId);
  
  if (!parsed || parsed.items.length === 0) {
    return { error: `Failed to parse checklist ${checklistId}.` };
  }
  
  // One active template per site (schema: siteId unique for active)
  const existing = await prisma.checklistTemplate.findFirst({
    where: { siteId, isActive: true },
  });

  if (existing) {
    await prisma.checklistTemplate.update({
      where: { id: existing.id },
      data: { items: parsed.items as any, version: existing.version + 1 },
    });
  } else {
    await prisma.checklistTemplate.create({
      data: {
        siteId,
        version: 1,
        isActive: true,
        items: parsed.items as any, // Prisma JSON type
      },
    });
  }
  
  // Get client ID from site
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { clientOrganizationId: true },
  });
  
  if (site) {
    revalidatePath(`/admin/clients/${site.clientOrganizationId}`);
  }
  revalidatePath(`/admin/clients`);
  
  return { success: true };
}

export async function removeChecklistTemplate(formData: FormData) {
  await requireAdmin();
  
  const templateId = formData.get("templateId") as string;
  
  if (!templateId) {
    return { error: "Template ID is required." };
  }
  
  // Get the site ID before deleting
  const template = await prisma.checklistTemplate.findUnique({
    where: { id: templateId },
    select: { siteId: true },
  });
  
  if (!template) {
    return { error: "Template not found." };
  }
  
  await prisma.checklistTemplate.delete({
    where: { id: templateId },
  });
  
  // Get client ID from site
  const site = await prisma.site.findUnique({
    where: { id: template.siteId },
    select: { clientOrganizationId: true },
  });
  
  if (site) {
    revalidatePath(`/admin/clients/${site.clientOrganizationId}`);
  }
  revalidatePath(`/admin/clients`);
  
  return { success: true };
}
