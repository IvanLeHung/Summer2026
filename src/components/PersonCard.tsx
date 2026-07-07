import { Check, CheckCircle2, Crown, Pencil, RotateCcw, Save, X } from "lucide-react";
import { useState } from "react";
import { Role, canCancelCheckin, canEditProfile } from "../config/permissions";
import { ActivityConfig, CheckinRecord } from "../types/checkin";
import { hasUserVerification, isCheckedIn, normalizeBoolean } from "../utils/checkin";
import { formatCheckinTime } from "../utils/format";

type Props = {
  person: CheckinRecord;
  activity: ActivityConfig;
  role: Role;
  onCheckIn: (id: string) => void;
  onCancel: (id: string) => void;
  onUpdateProfile: (id: string, updates: Partial<CheckinRecord>) => void;
};

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return parts
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const isSelfTravelVehicle = (vehicle: string) => {
  const normalized = vehicle.toLocaleLowerCase("vi-VN");
  return normalized.includes("tự túc") || normalized.includes("tu tuc");
};

export default function PersonCard({ person, activity, role, onCheckIn, onCancel, onUpdateProfile }: Props) {
  const checked = isCheckedIn(person, activity);
  const leader = normalizeBoolean(person.Truong_xe);
  const [editing, setEditing] = useState(false);
  const [phoneInput, setPhoneInput] = useState(String(person.SĐT ?? ""));
  const [departmentInput, setDepartmentInput] = useState(String(person.Phòng_ban ?? ""));
  const [unitInput, setUnitInput] = useState(String(person.Đơn_vị ?? ""));
  const [vehicleInput, setVehicleInput] = useState(String(person.Nhóm_xe ?? ""));
  const canVerify = hasUserVerification(person);
  const canEdit = canEditProfile(role);
  const id = String(person.Checkin_ID);
  const name = person.Họ_và_tên || "Chưa có tên";
  const employeeCode = role === "admin" ? person.Mã_NV || "Chưa có mã NV" : person.Mã_NV ? "Đã có mã NV" : "Không có mã NV";
  const phone = role === "admin" ? person.SĐT || "-" : person.SĐT ? "Đã có SĐT" : "-";

  const openEditor = () => {
    setPhoneInput(String(person.SĐT ?? ""));
    setDepartmentInput(String(person.Phòng_ban ?? ""));
    setUnitInput(String(person.Đơn_vị ?? ""));
    setVehicleInput(String(person.Nhóm_xe ?? ""));
    setEditing(true);
  };

  const saveProfile = () => {
    const vehicle = vehicleInput.trim();
    onUpdateProfile(id, {
      SĐT: phoneInput.trim(),
      Phòng_ban: departmentInput.trim(),
      Đơn_vị: unitInput.trim(),
      Nhóm_xe: vehicle,
      Có_đi_xe: vehicle ? !isSelfTravelVehicle(vehicle) : person.Có_đi_xe,
    });
    setEditing(false);
  };

  const toggleLeader = () => {
    onUpdateProfile(id, { Truong_xe: !leader });
  };

  return (
    <article
      className={`rounded-lg border px-3 py-2.5 shadow-sm transition ${
        checked ? "border-emerald-200 bg-emerald-50/80" : "border-slate-200 bg-white hover:border-blue-200"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${
              checked ? "bg-emerald-100 text-emerald-700" : leader ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {checked ? <CheckCircle2 className="h-5 w-5" /> : leader ? <Crown className="h-5 w-5" /> : initials(name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-extrabold text-slate-950">{name}</p>
              {leader ? (
                <span className="hidden rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700 sm:inline">
                  Trưởng xe
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {person.Phòng_ban || "Chưa có phòng ban"} • MS: {employeeCode}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">
              SĐT: {phone} • Xe: {person.Nhóm_xe || "-"} • Đơn vị: {person.Đơn_vị || "-"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canEdit && !editing ? (
            <>
              <button
                onClick={toggleLeader}
                title={leader ? "Bỏ trưởng xe" : "Gán trưởng xe"}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                  leader
                    ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:text-amber-700"
                }`}
              >
                <Crown className="h-4 w-4" />
              </button>
              <button
                onClick={openEditor}
                title="Sửa hồ sơ"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-700"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </>
          ) : null}

          {checked ? (
            <>
              <span className="hidden items-center gap-1 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-extrabold text-emerald-700 sm:inline-flex">
                <CheckCircle2 className="h-4 w-4" />
                Hoàn thành
              </span>
              {canCancelCheckin(role) ? (
                <button
                  onClick={() => onCancel(id)}
                  title="Hủy check-in"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              ) : null}
            </>
          ) : canVerify ? (
            <button
              onClick={() => onCheckIn(id)}
              className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <Check className="h-4 w-4" />
              Check-in
            </button>
          ) : canEdit ? (
            <button
              onClick={openEditor}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-amber-500 px-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-amber-600 active:scale-[0.98]"
            >
              Cập nhật thông tin
            </button>
          ) : null}
        </div>
      </div>

      {checked ? <p className="mt-2 text-xs font-semibold text-emerald-700">Lúc {formatCheckinTime(person[activity.timeField])}</p> : null}

      {editing ? (
        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
          <div className="grid gap-3 sm:grid-cols-4">
            <label className="text-xs font-black uppercase tracking-wide text-slate-500">
              SĐT
              <input
                value={phoneInput}
                onChange={(event) => setPhoneInput(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-xs font-black uppercase tracking-wide text-slate-500">
              Phòng ban
              <input
                value={departmentInput}
                onChange={(event) => setDepartmentInput(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-xs font-black uppercase tracking-wide text-slate-500">
              Đơn vị
              <input
                value={unitInput}
                onChange={(event) => setUnitInput(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
            <label className="text-xs font-black uppercase tracking-wide text-slate-500">
              Nhóm xe
              <input
                value={vehicleInput}
                onChange={(event) => setVehicleInput(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={saveProfile} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white">
              <Save className="h-4 w-4" />
              Lưu hồ sơ
            </button>
            <button onClick={() => setEditing(false)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700">
              <X className="h-4 w-4" />
              Hủy
            </button>
          </div>
        </div>
      ) : null}
    </article>
  );
}
