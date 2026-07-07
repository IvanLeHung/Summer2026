import { Bus, CheckCircle2, Circle, Search, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { activities } from "../config/activities";
import { CheckinRecord } from "../types/checkin";
import { getApplicableRecords, isCheckedIn } from "../utils/checkin";
import { toSearchText } from "../utils/format";

type Props = {
  leaders: CheckinRecord[];
  records: CheckinRecord[];
};

type StatusFilter = "all" | "done" | "missing";

const uniqueVehicles = (records: CheckinRecord[]) =>
  Array.from(new Set(records.map((record) => String(record.Nhóm_xe || "").trim()).filter(Boolean)));

export default function LeaderVehiclePanel({ leaders, records }: Props) {
  const vehicles = useMemo(() => uniqueVehicles(leaders), [leaders]);
  const [vehicle, setVehicle] = useState(() => vehicles[0] || "");
  const [activityId, setActivityId] = useState(activities[0]?.id || "");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [keyword, setKeyword] = useState("");

  const activeVehicle = vehicles.includes(vehicle) ? vehicle : vehicles[0] || "";
  const activity = activities.find((item) => item.id === activityId) || activities[0];
  const vehicleMembers = records.filter((record) => String(record.Nhóm_xe || "").trim() === activeVehicle);
  const applicableMembers = activity ? getApplicableRecords(vehicleMembers, activity) : vehicleMembers;
  const filteredMembers = applicableMembers.filter((record) => {
    const checked = activity ? isCheckedIn(record, activity) : false;
    if (status === "done" && !checked) return false;
    if (status === "missing" && checked) return false;
    if (!keyword.trim()) return true;
    return [record.Họ_và_tên, record.Mã_NV, record.SĐT, record.Phòng_ban, record.Đơn_vị, record.Điểm_đón]
      .map(toSearchText)
      .some((value) => value.includes(toSearchText(keyword)));
  });
  const checkedCount = activity ? applicableMembers.filter((record) => isCheckedIn(record, activity)).length : 0;
  const missingCount = applicableMembers.length - checkedCount;
  const percent = applicableMembers.length ? Math.round((checkedCount / applicableMembers.length) * 100) : 0;

  if (!vehicles.length || !activity) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
      <div className="border-b border-blue-50 bg-blue-50/70 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <Bus className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-wider text-blue-700">Bảng trưởng xe</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{activeVehicle}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Theo dõi danh sách xe, trạng thái check-in và lọc nhanh người còn thiếu.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-3 ring-1 ring-blue-100">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Tổng cần check-in</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{applicableMembers.length}</p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-emerald-100">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-600">Đã xong</p>
            <p className="mt-1 text-2xl font-black text-emerald-700">{checkedCount}</p>
          </div>
          <div className="rounded-xl bg-white p-3 ring-1 ring-amber-100">
            <p className="text-xs font-black uppercase tracking-wide text-amber-600">Còn thiếu</p>
            <p className="mt-1 text-2xl font-black text-amber-700">{missingCount}</p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {vehicles.length > 1 ? (
            <select
              value={activeVehicle}
              onChange={(event) => setVehicle(event.target.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {vehicles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          ) : null}

          <select
            value={activity.id}
            onChange={(event) => setActivityId(event.target.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {activities.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as StatusFilter)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="all">Tất cả</option>
            <option value="missing">Chưa check-in</option>
            <option value="done">Đã check-in</option>
          </select>
        </div>

        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Tìm tên, SĐT, mã NV, điểm đón..."
          />
        </label>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-black uppercase tracking-wider text-slate-500">Danh sách xe</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
            <UsersRound className="h-3.5 w-3.5" />
            {filteredMembers.length} người
          </span>
        </div>

        <div className="space-y-2">
          {filteredMembers.map((member) => {
            const checked = isCheckedIn(member, activity);
            return (
              <article
                key={member.Checkin_ID}
                className={`rounded-xl border p-3 ${checked ? "border-emerald-100 bg-emerald-50/70" : "border-slate-200 bg-white"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-950">{member.Họ_và_tên || "Chưa có tên"}</p>
                    <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                      {member.SĐT || "Chưa có SĐT"} • {member.Điểm_đón || "Chưa có điểm đón"}
                    </p>
                  </div>
                  {checked ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-slate-300" />
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {activities.map((item) => {
                    const done = isCheckedIn(member, item);
                    return (
                      <span
                        key={item.id}
                        title={item.label}
                        className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[10px] font-black ${
                          done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : item.shortLabel.slice(0, 2)}
                      </span>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
