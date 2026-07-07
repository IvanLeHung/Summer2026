export type CheckinRecord = {
  Checkin_ID?: string;
  Mã_NV?: string;
  Họ_và_tên?: string;
  Phòng_ban?: string;
  Chức_vụ?: string;
  SĐT?: string;
  Điểm_đón?: string;
  Đơn_vị?: string;
  Nhóm_xe?: string;
  Có_đi_xe?: boolean;
  Truong_xe?: boolean;
  Loai_phat_sinh?: string;
  Trang_thai_phat_sinh?: string;
  Xe_de_xuat?: string;
  Thoi_gian_phat_sinh?: string;
  Nguoi_bao_phat_sinh?: string;
  Người_checkin?: string;
  Nguoi_checkin_cuoi?: string;
  Lan_checkin_cuoi?: string;
  Ghi_chú?: string;
  Ghi_chu_noi_bo?: string;
  [key: string]: any;
};

export type ActivityConfig = {
  id: string;
  label: string;
  shortLabel: string;
  time: string;
  checkField: string;
  timeField: string;
  mealField?: string;
  opensAt?: string;
  appliesTo: "vehicle" | "meal" | "all";
};

export type ActivityStats = {
  total: number;
  checked: number;
  missing: number;
  percent: number;
};
