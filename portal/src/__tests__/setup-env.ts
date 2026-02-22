/**
 * Load env before any test or setup that uses DATABASE_URL (e.g. Prisma).
 * Run from portal/ so root .env is ../.env
 */
import path from "path";
import { config } from "dotenv";

const root = path.resolve(process.cwd(), "..");
config({ path: path.join(root, ".env") });
config({ path: path.join(process.cwd(), ".env") });
