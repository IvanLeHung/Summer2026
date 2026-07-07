export const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || "";

export type Role = "staff" | "admin";

export const canImport = (role: Role) => role === "admin";
export const canExport = (role: Role) => role === "admin";
export const canCancelCheckin = (role: Role) => role === "admin";
export const canEditNotes = (role: Role) => role === "admin";
export const canEditProfile = (role: Role) => role === "admin";
export const canResetData = (role: Role) => role === "admin";
export const canViewReport = (role: Role) => role === "admin";
export const canAccessAdmin = (role: Role) => role === "admin";
