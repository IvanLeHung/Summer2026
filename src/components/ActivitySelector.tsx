import { ChevronRight } from "lucide-react";
import { activities } from "../config/activities";
import { ActivityConfig, CheckinRecord } from "../types/checkin";
import { getActivityStats, getActivityWindowStatus } from "../utils/checkin";
import EmptyState from "./EmptyState";

type Props = {
  records: CheckinRecord[];
  onSelect: (activityId: string) => void;
  currentTime?: Date;
};

const statusTone = (activity: ActivityConfig, currentTime: Date) => {
  const status = getActivityWindowStatus(activity, currentTime);
  if (status === "open") {
    return {
      label: "Đang diễn ra",
      className: "bg-blue-50 text-blue-700 ring-blue-100",
    };
  }
  if (status === "closed") {
    return {
      label: "Đã kết thúc",
      className: "bg-slate-100 text-slate-600 ring-slate-200",
    };
  }
  return {
    label: "Sắp tới",
    className: "bg-amber-50 text-amber-700 ring-amber-100",
  };
};

export default function ActivitySelector({ records, onSelect, currentTime = new Date() }: Props) {
  if (!records.length) return <EmptyState title="Chưa có dữ liệu." detail="Vui lòng import file Excel ở chế độ Admin." />;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-slate-950">Điểm danh nhanh</h2>
        <p className="mt-1 text-sm text-slate-600">Chọn hoạt động, tìm nhân viên và check-in thủ công khi cần.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {activities.map((activity) => {
          const stats = getActivityStats(records, activity);
          const status = statusTone(activity, currentTime);
          const progressColor =
            stats.total === 0 ? "bg-slate-300" : stats.missing === 0 ? "bg-emerald-500" : "bg-blue-600";

          return (
            <button
              key={activity.id}
              onClick={() => onSelect(activity.id)}
              className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md active:scale-[0.99]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-extrabold text-slate-950">{activity.label}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ring-1 ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{activity.time}</p>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400" />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-bold text-slate-700">
                    {stats.checked}/{stats.total} đã check-in
                  </span>
                  <span className="font-semibold text-slate-500">Còn thiếu {stats.missing}</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${progressColor}`}
                    style={{ width: `${Math.min(100, Math.max(0, stats.percent))}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
