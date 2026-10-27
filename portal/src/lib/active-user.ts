import { prisma } from "./prisma";

/** True only when the user row exists and isActive is true. */
export async function isUserActive(userId: string): Promise<boolean> {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { isActive: true },
  });
  return dbUser?.isActive === true;
}
