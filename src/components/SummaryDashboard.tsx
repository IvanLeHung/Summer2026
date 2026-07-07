import { AlertTriangle, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { activities } from "../config/activities";
import { Role, canResetData, canViewReport } from "../config/permissions";
import { CheckinRecord } from "../types/checkin";
import { getActivityStats, getVehicleStats } from "../utils/checkin";
import { percentText } from "../utils/format";
import EmptyState from "./EmptyState";

type Props = {
  role: Role;
  records: CheckinRecord[];
  onReset: () => void;
};

export default function SummaryDashboard({ role, records, onReset }: Props) {
  const [activityId, setActivityId] = useState(activities[0].id);
  const [vehicle, setVehicle] = useState("Tất cả");
  const activity = activities.find((item) => item.id === activityId) || activities[0];
  const vehicles = useMemo(
    () => ["Tất cả", ...Array.from(new Set(records.map((record) => String(record.Nhóm_xe || "Chưa có nhóm xe"))))],
    [records],
  );
  const vehicleStats = getVehicleStats(records, activity).filter((row) => vehicle === "Tất cả" || row.vehicle === vehicle);

  const reset = () => {
    if (!window.confirm("Xác nhận lần 1: reset toàn bộ dữ liệu check-in?")) return;
    if (!window.confirm("Xác nhận lần 2: thao tác này sẽ xóa trạng thái điểm danh hiện tại.")) return;
    onReset();
  };

  if (!canViewReport(role)) return <EmptyState title="Bạn không có quyền xem báo cáo." />;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-stone-950">Báo cáo tổng hợp</h2>
          <p className="mt-1 text-sm text-stone-600">Theo hoạt động và nhóm xe.</p>
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
              onClick={() => setActivityId(item.id)}
              className={`rounded-lg border p-4 text-left ${activityId === item.id ? "border-brand-600 bg-brand-50" : "border-stone-200 bg-white"}`}
            >
              <p className="font-extrabold text-stone-950">{item.shortLabel}</p>
              <p className="mt-2 text-sm text-stone-600">Tổng {stats.total} · Đã {stats.checked} · Thiếu {stats.missing}</p>
              <div className="mt-3 h-2 rounded-full bg-stone-200">
                <div className="h-2 rounded-full bg-brand-600" style={{ width: `${stats.percent}%` }} />
              </div>
              <p className="mt-2 text-sm font-bold text-brand-700">{percentText(stats.percent)}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto font-extrabold text-stone-950">Theo nhóm xe: {activity.label}</p>
          <div className="flex max-w-full gap-2 overflow-x-auto">
            {vehicles.map((item) => (
              <button
                key={item}
                onClick={() => setVehicle(item)}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold ${vehicle === item ? "border-brand-600 bg-brand-600 text-white" : "border-stone-300"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {vehicleStats.length ? (
            vehicleStats.map((row) => (
              <div key={row.vehicle} className="rounded-lg bg-stone-50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-stone-950">{row.vehicle}</p>
                  <p className="text-sm font-bold text-brand-700">{percentText(row.percent)}</p>
                </div>
                <p className="mt-1 text-sm text-stone-600">Tổng {row.total} · Đã {row.checked} · Thiếu {row.missing}</p>
              </div>
            ))
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
