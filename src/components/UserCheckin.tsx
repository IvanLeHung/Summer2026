import { AlertTriangle, Bus, CheckCircle, Clock, Coffee, LogOut, Moon, PartyPopper, Trophy, UserRound, Utensils } from "lucide-react";
import { ActivityConfig, CheckinRecord } from "../types/checkin";
import {
  getApplicableActivitiesForRecord,
  getActivityOpenTime,
  getActivityWindow,
  getActivityWindowStatus,
  isActivityOpen,
  isCheckedIn,
} from "../utils/checkin";
import { formatCheckinTime } from "../utils/format";
import EmptyState from "./EmptyState";

type Props = {
  phone: string;
  people: CheckinRecord[];
  onCheckIn: (personId: string, activity: ActivityConfig) => void;
  onChangePhone: () => void;
  currentTime?: Date;
  uatMode?: boolean;
};

type ActivityTone = {
  tab: string;
  icon: string;
  badge: string;
  button: string;
  done: string;
};

const activityTones: ActivityTone[] = [
  {
    tab: "border-sky-100 bg-sky-50/80",
    icon: "bg-sky-100 text-sky-700",
    badge: "bg-sky-100 text-sky-800",
    button: "bg-sky-600 hover:bg-sky-700 active:bg-sky-700",
    done: "bg-emerald-50 text-emerald-700",
  },
  {
    tab: "border-amber-100 bg-amber-50/80",
    icon: "bg-amber-100 text-amber-700",
    badge: "bg-amber-100 text-amber-800",
    button: "bg-amber-600 hover:bg-amber-700 active:bg-amber-700",
    done: "bg-emerald-50 text-emerald-700",
  },
  {
    tab: "border-rose-100 bg-rose-50/80",
    icon: "bg-rose-100 text-rose-700",
    badge: "bg-rose-100 text-rose-800",
    button: "bg-rose-600 hover:bg-rose-700 active:bg-rose-700",
    done: "bg-emerald-50 text-emerald-700",
  },
  {
    tab: "border-teal-100 bg-teal-50/80",
    icon: "bg-teal-100 text-teal-700",
    badge: "bg-teal-100 text-teal-800",
    button: "bg-teal-600 hover:bg-teal-700 active:bg-teal-700",
    done: "bg-emerald-50 text-emerald-700",
  },
  {
    tab: "border-indigo-100 bg-indigo-50/80",
    icon: "bg-indigo-100 text-indigo-700",
    badge: "bg-indigo-100 text-indigo-800",
    button: "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-700",
    done: "bg-emerald-50 text-emerald-700",
  },
];

const formatOpenTime = (iso: string) => {
  if (!iso) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso));
};

const formatDateTime = (date?: Date) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  }).format(date);
};

const getActivityIcon = (activityId: string) => {
  if (activityId.includes("xe") || activityId === "tap_trung" || activityId === "ket_thuc") return Bus;
  if (activityId.includes("trua")) return Utensils;
  if (activityId.includes("toi")) return Coffee;
  if (activityId.includes("gala")) return PartyPopper;
  if (activityId.includes("chieu")) return Trophy;
  return Moon;
};

const toDisplayName = (name?: string, fallback?: string) => {
  const rawName = (name || fallback || "").trim();
  if (!rawName) return "anh/chị";
  const shortName = rawName.split(/\s+/).filter(Boolean).pop() || rawName;
  return shortName.charAt(0).toLocaleUpperCase("vi-VN") + shortName.slice(1).toLocaleLowerCase("vi-VN");
};

export default function UserCheckin({ phone, people, onCheckIn, onChangePhone, currentTime = new Date(), uatMode = false }: Props) {
  if (!people.length) {
    return (
      <section className="space-y-4">
        <button
          onClick={onChangePhone}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm"
        >
          <LogOut className="h-4 w-4" />
          Đổi số điện thoại
        </button>
        <EmptyState title="Không tìm thấy thông tin phù hợp" detail="Vui lòng kiểm tra lại số điện thoại hoặc liên hệ BTC." />
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
        <div className="relative h-32 overflow-hidden bg-brand-50 sm:h-40">
          <img
            src="/travel-banner-2026.png"
            alt="Danko Group Mùa Du Lịch 2026"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-brand-950/35 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 sm:left-5 sm:right-5">
            <div className="inline-block max-w-full rounded-2xl bg-slate-950/45 px-4 py-3 shadow-lg backdrop-blur-sm ring-1 ring-white/20">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white">Danko Group</p>
              <h2 className="mt-1 text-xl font-black leading-tight text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_0.55)] sm:text-2xl">
                Chào mừng anh/chị {toDisplayName(people[0]?.Họ_và_tên, phone)}, sẵn sàng cho chuyến đi chưa?
              </h2>
              {uatMode ? <p className="mt-2 text-xs font-black uppercase tracking-wider text-amber-200">UAT - không lưu dữ liệu chính</p> : null}
            </div>
          </div>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          <p className="text-sm font-semibold leading-6 text-slate-600">
            CBNV thực hiện check-in đầy đủ trước mỗi hoạt động theo lịch trình.
          </p>
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              Hệ thống sẽ ghi nhận lịch sử check-in để làm cơ sở tổng kết. Vui lòng hoàn thành đúng thời gian quy định để tránh các trường hợp bị phạt theo quy chế chung của Công ty.
            </p>
          </div>
        </div>
      </div>

      {people.map((person) => {
        const personActivities = getApplicableActivitiesForRecord(person);

        return (
          <article key={person.Checkin_ID} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <UserRound className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Hồ sơ</p>
                  <h2 className="break-words text-lg font-black text-slate-950">{person.Họ_và_tên || phone}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {person.Phòng_ban || "Chưa có phòng ban"} · {person.Đơn_vị || "Chưa có đơn vị"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {person.Nhóm_xe || "Không có nhóm xe"} · {person.Điểm_đón || "Chưa có điểm đón"}
                  </p>
                </div>
              </div>

              <button
                onClick={onChangePhone}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 active:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Đổi số
              </button>
            </div>

            <div className="p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-black uppercase tracking-wider text-slate-500">Mốc cần check-in</p>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                  {personActivities.length} mốc
                </span>
              </div>

              <div className="grid gap-3">
                {personActivities.map((activity, index) => {
                  const checked = isCheckedIn(person, activity);
                  const open = isActivityOpen(activity, currentTime);
                  const openAt = getActivityOpenTime(activity);
                  const window = getActivityWindow(activity);
                  const windowStatus = getActivityWindowStatus(activity, currentTime);
                  const closed = windowStatus === "closed";
                  const Icon = getActivityIcon(activity.id);
                  const tone = activityTones[index % activityTones.length];

                  return (
                    <div
                      key={activity.id}
                      className={`rounded-2xl border p-3 transition sm:p-4 ${tone.tab}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${checked ? "bg-emerald-100 text-emerald-700" : tone.icon}`}>
                          {checked ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="break-words text-base font-black text-slate-950">{activity.label}</p>
                              <p className="mt-1 text-sm font-semibold text-slate-600">{activity.time}</p>
                            </div>

                            {checked ? (
                              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${tone.done}`}>
                                <CheckCircle className="h-3.5 w-3.5" />
                                Hoàn thành
                              </span>
                            ) : open ? (
                              <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${tone.badge}`}>
                                <Clock className="h-3.5 w-3.5" />
                                Đang mở
                              </span>
                            ) : closed ? (
                              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-700">
                                <Clock className="h-3.5 w-3.5" />
                                Đã khóa
                              </span>
                            ) : (
                              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-black text-slate-500">
                                <Clock className="h-3.5 w-3.5" />
                                Sắp tới
                              </span>
                            )}
                          </div>

                          <div className="mt-3">
                            {checked ? (
                              <p className="text-sm font-bold text-emerald-700">Đã check-in lúc {formatCheckinTime(person[activity.timeField])}</p>
                            ) : open ? (
                              <button
                                onClick={() => onCheckIn(String(person.Checkin_ID), activity)}
                                className={`h-11 w-full rounded-xl px-5 font-extrabold text-white shadow-sm transition sm:w-auto ${tone.button}`}
                              >
                                Check-in
                              </button>
                            ) : closed ? (
                              <p className="text-sm font-bold text-rose-700">Đã quá hạn. Khóa lúc {formatDateTime(window?.closesAt)}</p>
                            ) : (
                              <p className="text-sm font-bold text-slate-500">Mở từ {formatDateTime(window?.opensAt) || formatOpenTime(openAt)} đến {formatDateTime(window?.closesAt)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
