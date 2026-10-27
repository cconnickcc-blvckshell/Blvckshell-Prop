import { readFile } from "node:fs/promises";
import path from "node:path";

/** Outside `public/` so Next does not serve it without auth. */
const BUSINESS_PLAN_PATH = path.join(
  process.cwd(),
  "content",
  "private",
  "business-plan.html"
);

export async function readBusinessPlanHtml(): Promise<string> {
  return readFile(BUSINESS_PLAN_PATH, "utf8");
}
