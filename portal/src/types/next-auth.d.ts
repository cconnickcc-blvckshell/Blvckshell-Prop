import { UserRole } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      workforceAccountId?: string;
      workerId?: string;
      clientOrganizationId?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    workforceAccountId?: string;
    workerId?: string;
    clientOrganizationId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    workforceAccountId?: string;
    workerId?: string;
    clientOrganizationId?: string;
  }
}
