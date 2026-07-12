import { type SystemRole } from "@/lib/permissions";

export type RoleProfile = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  baseRole: SystemRole;
  permissions: string[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  _count?: { users: number };
};

export type UserRow = {
  id: string;
  username: string;
  fullName: string;
  role: SystemRole;
  roleProfileId?: string | null;
  roleProfile?: RoleProfile | null;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  doctorProfile?: any;
};

export type ActiveTab = "users" | "roles";
export type Mode = "view" | "createUser" | "createRole" | "importUsers";
