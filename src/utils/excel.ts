import * as XLSX from "xlsx";
import { activities } from "../config/activities";
import { CheckinRecord } from "../types/checkin";
import { ensureCheckinColumns, getActivityStats, getVehicleStats } from "./checkin";
import { toSearchText } from "./format";

const detailColumnMap: Record<string, string> = {
  "ma nv": "Mã_NV",
  "ho va ten": "Họ_và_tên",
  "phong ban": "Phòng_ban",
  "chuc vu": "Chức_vụ",
  sdt: "SĐT",
  "diem don": "Điểm_đón",
  "don vi": "Đơn_vị",
  "an trua 12/7": "Suất_trưa_12_7",
  "dd trua 12/7": "DD_trưa_12_7",
  "an toi 12/7": "Suất_tối_12_7",
  "dd toi 12/7": "DD_tối_12_7",
  "an trua 13/7": "Suất_trưa_13_7",
  "dd trua 13/7": "DD_trưa_13_7",
  "ky/ghi chu": "Ghi_chú",
};

const shouldSkipSheet = (sheetName: string) => {
  const normalized = toSearchText(sheetName);
  return normalized.includes("tong hop") || normalized.includes("danh muc");
};

const parseDetailSheets = (workbook: XLSX.WorkBook): CheckinRecord[] => {
  const records: CheckinRecord[] = [];

  workbook.SheetNames.filter((sheetName) => !shouldSkipSheet(sheetName)).forEach((sheetName) => {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: "" });
    const headerIndex = rows.findIndex((row) => row.some((cell) => toSearchText(cell) === "ho va ten"));
    if (headerIndex < 0) return;

    const title = String(rows[0]?.[0] || sheetName).trim();
    const isSelfTravelSheet = toSearchText(sheetName) === "tt" || toSearchText(title).includes("tu tuc");
    const headers = rows[headerIndex].map((cell) => detailColumnMap[toSearchText(cell)] || "");

    rows.slice(headerIndex + 1).forEach((row, rowIndex) => {
      const name = String(row[2] || "").trim();
      if (!name) return;

      const record: CheckinRecord = {
        Checkin_ID: `${sheetName}_${rowIndex + 1}`,
        Nhóm_xe: isSelfTravelSheet ? "TỰ TÚC" : sheetName,
        Có_đi_xe: !isSelfTravelSheet,
      };

      headers.forEach((field, columnIndex) => {
        if (!field) return;
        record[field] = row[columnIndex] ?? "";
      });

      record.SĐT = String(row[5] ?? record.SĐT ?? "").trim();
      record.Điểm_đón = String(row[6] ?? record.Điểm_đón ?? "").trim();
      record.Đơn_vị = String(row[7] ?? record.Đơn_vị ?? "").trim();

      if (toSearchText(record.Điểm_đón).includes("tu tuc")) {
        record.Nhóm_xe = "TỰ TÚC";
        record.Có_đi_xe = false;
      }

      if (record.Mã_NV) {
        record.Checkin_ID = `${record.Mã_NV}_${sheetName}_${rowIndex + 1}`;
      }

      records.push(record);
    });
  });

  return records;
};

export const importExcelBuffer = (buffer: ArrayBuffer): { records: CheckinRecord[]; warning?: string } => {
  const workbook = XLSX.read(buffer, { type: "array" });
  if (!workbook.SheetNames.includes("Checkin_App")) {
    const detailRecords = parseDetailSheets(workbook);
    if (detailRecords.length) {
      return {
        records: ensureCheckinColumns(detailRecords),
        warning: "Không tìm thấy sheet Checkin_App, đã gộp dữ liệu từ các sheet xe/nhóm.",
      };
    }
  }

  const sheetName = workbook.SheetNames.includes("Checkin_App") ? "Checkin_App" : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<CheckinRecord>(sheet, { defval: "" });

  return {
    records: ensureCheckinColumns(rows),
    warning: sheetName === "Checkin_App" ? undefined : "Không tìm thấy sheet Checkin_App, đã đọc sheet đầu tiên.",
  };
};

export const importExcel = async (file: File): Promise<{ records: CheckinRecord[]; warning?: string }> => {
  const buffer = await file.arrayBuffer();
  return importExcelBuffer(buffer);
};

export const exportExcel = (records: CheckinRecord[]) => {
  const workbook = XLSX.utils.book_new();
  const activityReport = activities.map((activity) => ({
    Hoạt_động: activity.label,
    Tổng_cần_checkin: getActivityStats(records, activity).total,
    Đã_checkin: getActivityStats(records, activity).checked,
    Còn_thiếu: getActivityStats(records, activity).missing,
    Tỷ_lệ: `${Math.round(getActivityStats(records, activity).percent)}%`,
  }));

  const vehicleReport = activities.flatMap((activity) =>
    getVehicleStats(records, activity).map((row) => ({
      Hoạt_động: activity.label,
      Nhóm_xe: row.vehicle,
      Tổng_cần_checkin: row.total,
      Đã_checkin: row.checked,
      Còn_thiếu: row.missing,
      Tỷ_lệ: `${Math.round(row.percent)}%`,
    })),
  );

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(records), "Checkin_App");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(activityReport), "Bao_cao_theo_hoat_dong");
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(vehicleReport), "Bao_cao_theo_xe");
  XLSX.writeFile(workbook, "Checkin_su_kien_da_diem_danh.xlsx");
};
