import { Role } from "../config/permissions";
import { CheckinRecord } from "../types/checkin";
import { ensureCheckinColumns } from "./checkin";

const RECORDS_KEY = "checkin_records";
const ROLE_KEY = "checkin_role";
const ACTIVITY_KEY = "selected_activity";
const USER_PHONE_KEY = "checkin_user_phone";
const UAT_MODE_KEY = "checkin_uat_mode";
const UAT_NOW_KEY = "checkin_uat_now";

export const loadRecords = (): CheckinRecord[] => {
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? ensureCheckinColumns(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
};

export const saveRecords = (records: CheckinRecord[]) => {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
};

export const loadRole = (): Role => (localStorage.getItem(ROLE_KEY) === "admin" ? "admin" : "staff");

export const saveRole = (role: Role) => {
  localStorage.setItem(ROLE_KEY, role);
};

export const loadSelectedActivity = () => localStorage.getItem(ACTIVITY_KEY) || undefined;

export const saveSelectedActivity = (activityId?: string) => {
  if (activityId) localStorage.setItem(ACTIVITY_KEY, activityId);
  else localStorage.removeItem(ACTIVITY_KEY);
};

export const loadUserPhone = () => localStorage.getItem(USER_PHONE_KEY) || "";

export const saveUserPhone = (phone?: string) => {
  if (phone) localStorage.setItem(USER_PHONE_KEY, phone);
  else localStorage.removeItem(USER_PHONE_KEY);
};

export const loadUatMode = () => localStorage.getItem(UAT_MODE_KEY) === "1";

export const saveUatMode = (enabled: boolean) => {
  if (enabled) localStorage.setItem(UAT_MODE_KEY, "1");
  else localStorage.removeItem(UAT_MODE_KEY);
};

export const loadUatNow = () => localStorage.getItem(UAT_NOW_KEY) || "";

export const saveUatNow = (value?: string) => {
  if (value) localStorage.setItem(UAT_NOW_KEY, value);
  else localStorage.removeItem(UAT_NOW_KEY);
};

export const resetCheckinsInStorage = (records: CheckinRecord[]) => {
  saveRecords(records);
};
