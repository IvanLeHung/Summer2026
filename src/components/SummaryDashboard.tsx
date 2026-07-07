import { AlertTriangle, ArrowRightLeft, Bell, Bus, Check, CheckCircle2, ChevronDown, Clock, CopyCheck, Eye, PhoneCall, RotateCcw, UserRound, X, CircleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { activities } from "../config/activities";
import { Role, canResetData, canViewReport } from "../config/permissions";
import { ActivityConfig, CheckinRecord } from "../types/checkin";
import { getActivityStats, getApplicableRecords, getVehicleStats, isCheckedIn, normalizeBoolean } from "../utils/checkin";
import { percentText, toSearchText } from "../utils/format";
import EmptyState from "./EmptyState";

type Props = {
  role: Role;
  records: CheckinRecord[];
  onReset: () => void;
  onUpdateProfile: (id: string, updates: Partial<CheckinRecord>) => void;
};

type VehicleRow = ReturnType<typeof getVehicleStats>[number];
type DetailFilter = "all" | "done" | "missing";

type VehicleGroup = {
  label: string;
  rows: VehicleRow[];
};

const vehicleGroupLabel = (vehicle: string) => {
  const normalized = toSearchText(vehicle);
  if (normalized.includes("khach") || normalized.includes("bld") || normalized.includes("pv") || normalized.includes("dsea") || normalized.includes("dstyle")) {
    return "Xe sự kiện";
  }
  if (normalized.startsWith("bg") || normalized.startsWith("dk") || normalized.startsWith("th") || normalized.startsWith("tq")) {
    return "Xe ngoại tỉnh";
  }
  if (normalized.includes("tu tuc") || normalized.includes("tự túc")) {
    return "Tự túc";
  }
  return "Xe nội bộ";
};

const buildVehicleGroups = (rows: VehicleRow[]): VehicleGroup[] => {
  const grouped = rows.reduce<Record<string, VehicleRow[]>>((groups, row) => {
    const label = vehicleGroupLabel(row.vehicle);
    groups[label] = groups[label] || [];
    groups[label].push(row);
    return groups;
  }, {});

  return ["Xe sự kiện", "Xe nội bộ", "Xe ngoại tỉnh", "Tự túc"]
    .map((label) => ({ label, rows: grouped[label] || [] }))
    .filter((group) => group.rows.length > 0);
};

const getVehicleMembers = (records: CheckinRecord[], vehicle: string, activity: ActivityConfig) =>
  getApplicableRecords(records.filter((record) => String(record.Nhóm_xe || "") === vehicle), activity);

const getLeaders = (records: CheckinRecord[], vehicle: string) =>
  records.filter((record) => String(record.Nhóm_xe || "") === vehicle && normalizeBoolean(record.Truong_xe));

const getLeaderNames = (records: CheckinRecord[], vehicle: string) => {
  const names = getLeaders(records, vehicle)
    .map((record) => String(record.Họ_và_tên || "").trim())
    .filter(Boolean);
  return names.length ? names.join(", ") : "Chưa gán";
};

const getLeaderPhone = (records: CheckinRecord[], vehicle: string) => String(getLeaders(records, vehicle)[0]?.SĐT || "").trim();

const getGroupLeaderSummary = (records: CheckinRecord[], rows: VehicleRow[]) => {
  const vehicles = new Set(rows.map((row) => row.vehicle));
  const leaders = records
    .filter((record) => vehicles.has(String(record.Nhóm_xe || "")) && normalizeBoolean(record.Truong_xe))
    .map((record) => String(record.Họ_và_tên || "").trim())
    .filter(Boolean);

  if (!leaders.length) return "Chưa gán trưởng xe";
  if (leaders.length <= 2) return `Trưởng xe: ${leaders.join(", ")}`;
  return `Trưởng xe: ${leaders.slice(0, 2).join(", ")} +${leaders.length - 2}`;
};

const statusMeta = (checked: boolean) =>
  checked
    ? { label: "Đã check-in", icon: CheckCircle2, className: "text-emerald-600 bg-emerald-50" }
    : { label: "Chưa check-in", icon: CircleAlert, className: "text-rose-600 bg-rose-50" };

const isSelfTravelVehicle = (vehicle: string) => {
  const normalized = toSearchText(vehicle);
  return normalized.includes("tu tuc") || normalized.includes("tự túc");
};

export default function SummaryDashboard({ role, records, onReset, onUpdateProfile }: Props) {
  const [activityId, setActivityId] = useState(activities[0].id);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [detailFilter, setDetailFilter] = useState<DetailFilter>("all");
  const [copiedPhone, setCopiedPhone] = useState("");
  const [transferPersonId, setTransferPersonId] = useState("");
  const [transferVehicle, setTransferVehicle] = useState("");
  const activity = activities.find((item) => item.id === activityId) || activities[0];
  const vehicleStats = useMemo(() => getVehicleStats(records, activity), [records, activity]);
  const vehicleGroups = useMemo(() => buildVehicleGroups(vehicleStats), [vehicleStats]);
  const vehicleOptions = useMemo(
    () => Array.from(new Set(records.map((record) => String(record.Nhóm_xe || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "vi")),
    [records],
  );

  const reset = () => {
    if (!window.confirm("Xác nhận lần 1: reset toàn bộ dữ liệu check-in?")) return;
    if (!window.confirm("Xác nhận lần 2: thao tác này sẽ xóa trạng thái điểm danh hiện tại.")) return;
    onReset();
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((current) => ({ ...current, [label]: !current[label] }));
  };

  const copyPhone = async (phone: string) => {
    if (!phone) return;
    await navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    window.setTimeout(() => setCopiedPhone(""), 1200);
  };

  const remindMissing = (vehicle: string) => {
    const missing = getVehicleMembers(records, vehicle, activity).filter((member) => !isCheckedIn(member, activity));
    window.alert(`Cần nhắc ${missing.length} người chưa check-in trên xe ${vehicle}.`);
  };

  const startTransfer = (member: CheckinRecord) => {
    setTransferPersonId(String(member.Checkin_ID));
    setTransferVehicle(String(member.Nhóm_xe || ""));
  };

  const confirmTransfer = (member: CheckinRecord) => {
    const vehicle = transferVehicle.trim();
    if (!vehicle) return;
    onUpdateProfile(String(member.Checkin_ID), {
      Nhóm_xe: vehicle,
      Có_đi_xe: !isSelfTravelVehicle(vehicle),
    });
    setTransferPersonId("");
    setTransferVehicle("");
  };

  if (!canViewReport(role)) return <EmptyState title="Bạn không có quyền xem báo cáo." />;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950">Báo cáo tổng hợp</h2>
          <p className="mt-1 text-sm text-slate-600">Theo hoạt động và nhóm xe.</p>
        </div>
        {canResetData(role) ? (
          <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-bold text-white">
            <RotateCcw className="h-4 w-4" />
            Reset check-in
          </button>
        ) : null}
      </div>

      {!records.length ? <EmptyState title="Vui lòng import file Excel." /> : null}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {activities.map((item) => {
          const stats = getActivityStats(records, item);
          return (
            <button
              key={item.id}
              onClick={() => {
                setActivityId(item.id);
                setSelectedVehicle("");
                setDetailFilter("all");
                setTransferPersonId("");
              }}
              className={`rounded-lg border p-4 text-left transition ${
                activityId === item.id ? "border-blue-600 bg-blue-50" : "border-slate-200 bg-white hover:border-blue-200"
              }`}
            >
              <p className="font-extrabold text-slate-950">{item.shortLabel}</p>
              <p className="mt-2 text-sm text-slate-600">Tổng {stats.total} · Đã {stats.checked} · Thiếu {stats.missing}</p>
              <p className="mt-2 text-sm font-bold text-blue-700">{percentText(stats.percent)}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-extrabold text-slate-950">Theo nhóm xe: {activity.label}</p>
            <p className="mt-1 text-sm text-slate-500">Mặc định thu gọn, mở nhóm xe cần kiểm tra.</p>
          </div>
          {selectedVehicle ? (
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 ring-1 ring-blue-100">
              Đang xem: {selectedVehicle}
            </span>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          {vehicleGroups.length ? (
            vehicleGroups.map((group) => {
              const open = Boolean(expandedGroups[group.label]);
              return (
                <div key={group.label} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="flex w-full items-center justify-between gap-3 bg-slate-50 p-4 text-left transition hover:bg-slate-100"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                        <Bus className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-slate-900">{group.label}</h3>
                        <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                          {group.rows.length} xe · {getGroupLeaderSummary(records, group.rows)}
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
                  </button>

                  {open ? (
                    <div className="divide-y divide-slate-100 p-2">
                      {group.rows.map((row) => {
                        const selected = selectedVehicle === row.vehicle;
                        const leaderPhone = getLeaderPhone(records, row.vehicle);
                        const members = getVehicleMembers(records, row.vehicle, activity);
                        const visibleMembers = members.filter((member) => {
                          const checked = isCheckedIn(member, activity);
                          if (detailFilter === "done") return checked;
                          if (detailFilter === "missing") return !checked;
                          return true;
                        });

                        return (
                          <div key={row.vehicle} className={`rounded-md px-2 py-3 ${selected ? "bg-blue-50" : ""}`}>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-2">
                                <Bus className="h-4 w-4 shrink-0 text-slate-400" />
                                <div className="min-w-0">
                                  <span className="block truncate text-sm font-bold text-slate-800">{row.vehicle}</span>
                                  <span className="mt-0.5 flex items-center gap-1 truncate text-xs font-semibold text-slate-500">
                                    <UserRound className="h-3.5 w-3.5 shrink-0" />
                                    Trưởng xe: {getLeaderNames(records, row.vehicle)}
                                    <button
                                      onClick={() => copyPhone(leaderPhone)}
                                      disabled={!leaderPhone}
                                      title={leaderPhone ? "Copy SĐT trưởng xe" : "Chưa có SĐT trưởng xe"}
                                      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 disabled:text-slate-300"
                                    >
                                      {copiedPhone === leaderPhone ? <CopyCheck className="h-3.5 w-3.5 text-emerald-600" /> : <PhoneCall className="h-3.5 w-3.5" />}
                                    </button>
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedVehicle(selected ? "" : row.vehicle);
                                  setDetailFilter("all");
                                  setTransferPersonId("");
                                }}
                                className={`inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                                  selected ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                                }`}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                {selected ? "Đang xem" : "Xem chi tiết"}
                              </button>
                            </div>

                            {selected ? (
                              <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
                                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 p-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-black text-slate-950">{row.vehicle}</p>
                                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs font-semibold text-slate-500">
                                      Trưởng xe: {getLeaderNames(records, row.vehicle)}
                                      <button
                                        onClick={() => copyPhone(leaderPhone)}
                                        disabled={!leaderPhone}
                                        title={leaderPhone ? "Copy SĐT trưởng xe" : "Chưa có SĐT trưởng xe"}
                                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 disabled:text-slate-300"
                                      >
                                        {copiedPhone === leaderPhone ? <CopyCheck className="h-3.5 w-3.5 text-emerald-600" /> : <PhoneCall className="h-3.5 w-3.5" />}
                                      </button>
                                      · Tổng {members.length} người
                                    </p>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      onClick={() => remindMissing(row.vehicle)}
                                      className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100"
                                    >
                                      <Bell className="h-3.5 w-3.5" />
                                      Nhắc nhở
                                    </button>
                                    {[
                                      ["all", "Tất cả"],
                                      ["done", "Đã check-in"],
                                      ["missing", "Chưa check-in"],
                                    ].map(([key, label]) => (
                                      <button
                                        key={key}
                                        onClick={() => setDetailFilter(key as DetailFilter)}
                                        className={`rounded-md px-3 py-1.5 text-xs font-bold ${
                                          detailFilter === key ? "bg-blue-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                                        }`}
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <div className="overflow-x-auto">
                                  <table className="w-full text-sm">
                                    <thead className="border-b bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-400">
                                      <tr>
                                        <th className="p-3 text-left">Nhân viên</th>
                                        <th className="p-3 text-center">Liên hệ</th>
                                        <th className="p-3 text-center">Trạng thái</th>
                                        <th className="p-3 text-center">Điều chuyển</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {visibleMembers.map((member) => {
                                        const checked = isCheckedIn(member, activity);
                                        const meta = statusMeta(checked);
                                        const StatusIcon = meta.icon || Clock;
                                        const phone = String(member.SĐT || "").trim();
                                        const transferring = transferPersonId === String(member.Checkin_ID);

                                        return (
                                          <tr key={member.Checkin_ID} className="transition hover:bg-blue-50/60">
                                            <td className="p-3">
                                              <div className="font-bold text-slate-800">{member.Họ_và_tên || "Chưa có tên"}</div>
                                              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                                MS: {member.Mã_NV || "Chưa có mã"} · {member.Điểm_đón || "Chưa có điểm đón"}
                                              </div>
                                            </td>
                                            <td className="p-3 text-center">
                                              <button
                                                onClick={() => copyPhone(phone)}
                                                disabled={!phone}
                                                title={phone ? "Copy SĐT" : "Chưa có SĐT"}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 disabled:text-slate-300"
                                              >
                                                {copiedPhone === phone ? <CopyCheck className="h-4 w-4 text-emerald-600" /> : <PhoneCall className="h-4 w-4" />}
                                              </button>
                                            </td>
                                            <td className="p-3 text-center">
                                              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${meta.className}`} title={meta.label}>
                                                <StatusIcon className="h-4 w-4" />
                                              </span>
                                            </td>
                                            <td className="p-3 text-center">
                                              {transferring ? (
                                                <div className="flex min-w-56 items-center justify-end gap-1">
                                                  <select
                                                    value={transferVehicle}
                                                    onChange={(event) => setTransferVehicle(event.target.value)}
                                                    className="h-9 min-w-32 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                                  >
                                                    {vehicleOptions.map((vehicle) => (
                                                      <option key={vehicle} value={vehicle}>
                                                        {vehicle}
                                                      </option>
                                                    ))}
                                                  </select>
                                                  <button
                                                    onClick={() => confirmTransfer(member)}
                                                    title="Lưu điều chuyển"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                                                  >
                                                    <Check className="h-4 w-4" />
                                                  </button>
                                                  <button
                                                    onClick={() => setTransferPersonId("")}
                                                    title="Hủy"
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                                                  >
                                                    <X className="h-4 w-4" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <button
                                                  onClick={() => startTransfer(member)}
                                                  className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100"
                                                >
                                                  <ArrowRightLeft className="h-3.5 w-3.5" />
                                                  Điều chuyển
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              Không có dữ liệu phù hợp.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
