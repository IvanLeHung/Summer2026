import { ActivityConfig } from "../types/checkin";

export const activities: ActivityConfig[] = [
  {
    id: "len_xe_di",
    label: "Xe đi",
    shortLabel: "Xe đi",
    time: "05:30 ngày 12/7",
    opensAt: "2026-07-12T05:30:00+07:00",
    checkField: "DD_len_xe_di",
    timeField: "TG_len_xe_di",
    appliesTo: "vehicle",
  },
  {
    id: "trua_12_7",
    label: "Trưa 12/7",
    shortLabel: "Trước bữa trưa",
    time: "10:45 ngày 12/7",
    opensAt: "2026-07-12T10:45:00+07:00",
    checkField: "DD_trưa_12_7",
    timeField: "TG_trưa_12_7",
    mealField: "Suất_trưa_12_7",
    appliesTo: "meal",
  },
  {
    id: "toi_12_7",
    label: "Tối 12/7",
    shortLabel: "Trước bữa tối",
    time: "18:45 ngày 12/7",
    opensAt: "2026-07-12T18:45:00+07:00",
    checkField: "DD_tối_12_7",
    timeField: "TG_tối_12_7",
    mealField: "Suất_tối_12_7",
    appliesTo: "meal",
  },
  {
    id: "trua_13_7",
    label: "Trưa 13/7",
    shortLabel: "Trước bữa trưa 13/7",
    time: "10:45 ngày 13/7",
    opensAt: "2026-07-13T10:45:00+07:00",
    checkField: "DD_trưa_13_7",
    timeField: "TG_trưa_13_7",
    mealField: "Suất_trưa_13_7",
    appliesTo: "meal",
  },
  {
    id: "len_xe_ve",
    label: "Xe về HN",
    shortLabel: "Xe về HN",
    time: "14:00 ngày 13/7",
    opensAt: "2026-07-13T14:00:00+07:00",
    checkField: "DD_len_xe_ve",
    timeField: "TG_len_xe_ve",
    appliesTo: "vehicle",
  },
];

export const getActivityById = (id?: string) => activities.find((activity) => activity.id === id);
