import { activities } from "../config/activities";
import { ActivityConfig, ActivityStats, CheckinRecord } from "../types/checkin";
import { toSearchText } from "./format";

const emptyCheckinColumns: Record<string, unknown> = {
  DD_len_xe_di: false,
  TG_len_xe_di: "",
  DD_trưa_12_7: false,
  TG_trưa_12_7: "",
  DD_tối_12_7: false,
  TG_tối_12_7: "",
  DD_len_xe_ve: false,
  TG_len_xe_ve: "",
  DD_trưa_13_7: false,
  TG_trưa_13_7: "",
  Nguoi_checkin_cuoi: "",
  Lan_checkin_cuoi: "",
  Ghi_chu_noi_bo: "",
};

export const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = toSearchText(value);
  if (["true", "co", "có", "x", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "khong", "không", "0", "no", "n", ""].includes(normalized)) return false;
  return false;
};

const normalizeVehicleGroup = (value: unknown) => toSearchText(value).replace(/\s+/g, " ");
const isSelfTravel = (record: CheckinRecord) => normalizeVehicleGroup(record.Nhóm_xe).includes("tu tuc");

const booleanFields = new Set([
  "Có_đi_xe",
  ...activities.map((activity) => activity.checkField),
  ...activities.map((activity) => activity.mealField).filter(Boolean),
]);

export const ensureCheckinColumns = (records: CheckinRecord[]) =>
  records.map((record, index) => {
    const normalized: CheckinRecord = { ...emptyCheckinColumns, ...record };

    if (!normalized.Checkin_ID) {
      normalized.Checkin_ID = normalized.Mã_NV ? String(normalized.Mã_NV) : `CHECKIN_${index + 1}`;
    }

    if (normalized.DD_lên_xe !== undefined && normalized.DD_len_xe_di === false) {
      normalized.DD_len_xe_di = normalizeBoolean(normalized.DD_lên_xe);
    }
    if (normalized.TG_lên_xe !== undefined && !normalized.TG_len_xe_di) {
      normalized.TG_len_xe_di = String(normalized.TG_lên_xe ?? "");
    }

    booleanFields.forEach((field) => {
      if (field && normalized[field] !== undefined) {
        normalized[field] = normalizeBoolean(normalized[field]);
      }
    });

    return normalized;
  });

export const getApplicableRecords = (records: CheckinRecord[], activity: ActivityConfig) =>
  records.filter((record) => {
    if (activity.appliesTo === "all") return true;
    if (activity.appliesTo === "meal") return activity.mealField ? normalizeBoolean(record[activity.mealField]) : false;
    return normalizeBoolean(record.Có_đi_xe) && Boolean(record.Nhóm_xe) && !isSelfTravel(record);
  });

export const isCheckedIn = (record: CheckinRecord, activity: ActivityConfig) =>
  normalizeBoolean(record[activity.checkField]);

const digitsOnly = (value: unknown) => String(value ?? "").replace(/\D/g, "");
const phoneDigitParts = (value: unknown) =>
  String(value ?? "")
    .split(/[^0-9]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4);

export const normalizePhoneInput = (value: unknown) => digitsOnly(value);

export const recordMatchesPhone = (record: CheckinRecord, phone: string) => {
  const input = normalizePhoneInput(phone);
  if (input.length < 8) return false;
  return phoneDigitParts(record.SĐT).some((part) => part === input || part.endsWith(input) || input.endsWith(part));
};

export const findRecordsByPhone = (records: CheckinRecord[], phone: string) =>
  records.filter((record) => recordMatchesPhone(record, phone));

export const getApplicableActivitiesForRecord = (record: CheckinRecord) =>
  activities.filter((activity) => getApplicableRecords([record], activity).length > 0);

export const CHECKIN_OPEN_BEFORE_MINUTES = 10;
export const CHECKIN_CLOSE_AFTER_MINUTES = 5;

export const getActivityWindow = (activity: ActivityConfig) => {
  if (!activity.opensAt) return undefined;
  const eventTime = new Date(activity.opensAt);
  return {
    eventTime,
    opensAt: new Date(eventTime.getTime() - CHECKIN_OPEN_BEFORE_MINUTES * 60 * 1000),
    closesAt: new Date(eventTime.getTime() + CHECKIN_CLOSE_AFTER_MINUTES * 60 * 1000),
  };
};

export const getActivityWindowStatus = (activity: ActivityConfig, now = new Date()) => {
  const window = getActivityWindow(activity);
  if (!window) return "open";
  if (now.getTime() < window.opensAt.getTime()) return "early";
  if (now.getTime() > window.closesAt.getTime()) return "closed";
  return "open";
};

export const isActivityOpen = (activity: ActivityConfig, now = new Date()) => {
  return getActivityWindowStatus(activity, now) === "open";
};

export const getActivityOpenTime = (activity: ActivityConfig) => activity.opensAt || "";

export const hasUserVerification = (record: CheckinRecord) =>
  Boolean(String(record.Mã_NV ?? "").trim()) || digitsOnly(record.SĐT).length >= 4;

export const verifyUserCredential = (record: CheckinRecord, credential: string) => {
  const input = String(credential ?? "").trim();
  const inputDigits = digitsOnly(input);
  const employeeCode = String(record.Mã_NV ?? "").trim().toLowerCase();
  const phoneParts = phoneDigitParts(record.SĐT);

  if (employeeCode && input.toLowerCase() === employeeCode) {
    return { ok: true, method: "Mã NV" };
  }

  if (inputDigits.length >= 4 && phoneParts.some((phone) => phone.slice(-4) === inputDigits.slice(-4))) {
    return { ok: true, method: "4 số cuối SĐT" };
  }

  return { ok: false, method: "" };
};

export const checkInRecord = (record: CheckinRecord, activity: ActivityConfig, verifiedBy = "", nowDate = new Date()) => {
  const now = nowDate.toISOString();
  return {
    ...record,
    [activity.checkField]: true,
    [activity.timeField]: now,
    Nguoi_checkin_cuoi: record.Họ_và_tên ?? "",
    Lan_checkin_cuoi: now,
    Xac_thuc_checkin_cuoi: verifiedBy,
  };
};

export const cancelCheckInRecord = (record: CheckinRecord, activity: ActivityConfig) => ({
  ...record,
  [activity.checkField]: false,
  [activity.timeField]: "",
  Lan_checkin_cuoi: new Date().toISOString(),
});

export const getActivityStats = (records: CheckinRecord[], activity: ActivityConfig): ActivityStats => {
  const applicable = getApplicableRecords(records, activity);
  const checked = applicable.filter((record) => isCheckedIn(record, activity)).length;
  const total = applicable.length;
  return {
    total,
    checked,
    missing: total - checked,
    percent: total ? (checked / total) * 100 : 0,
  };
};

export const groupByVehicle = (records: CheckinRecord[]) =>
  records.reduce<Record<string, CheckinRecord[]>>((groups, record) => {
    const key = String(record.Nhóm_xe || "Chưa có nhóm xe");
    groups[key] = groups[key] || [];
    groups[key].push(record);
    return groups;
  }, {});

export const getVehicleStats = (records: CheckinRecord[], activity: ActivityConfig) => {
  const applicable = getApplicableRecords(records, activity);
  return Object.entries(groupByVehicle(applicable)).map(([vehicle, people]) => {
    const checked = people.filter((record) => isCheckedIn(record, activity)).length;
    return {
      vehicle,
      total: people.length,
      checked,
      missing: people.length - checked,
      percent: people.length ? (checked / people.length) * 100 : 0,
    };
  });
};

export const searchRecords = (records: CheckinRecord[], keyword: string) => {
  const q = toSearchText(keyword);
  if (!q) return records;
  return records.filter((record) =>
    [record.Họ_và_tên, record.Mã_NV, record.SĐT, record.Phòng_ban, record.Nhóm_xe, record.Đơn_vị]
      .map(toSearchText)
      .some((value) => value.includes(q)),
  );
};

export const getVehicleChips = (records: CheckinRecord[]) => {
  const defaults = ["Tất cả", "Hà Nội", "Tuyên Quang", "Thanh Hóa", "Tự túc"];
  const dynamic = Array.from(new Set(records.map((record) => String(record.Nhóm_xe || "").trim()).filter(Boolean)));
  return Array.from(new Set([...defaults, ...dynamic]));
};
