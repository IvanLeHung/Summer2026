import {
  AlertTriangle,
  Bus,
  CalendarDays,
  CopyCheck,
  FilePenLine,
  Hotel,
  MapPin,
  PhoneCall,
  Search,
  Send,
  Sparkles,
  UsersRound,
  Utensils,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { CheckinRecord } from "../types/checkin";
import { toSearchText } from "../utils/format";

type Props = {
  leaders: CheckinRecord[];
  records: CheckinRecord[];
  onReportIssue: (personId: string, updates: Partial<CheckinRecord>) => void;
};

const issueTypes = [
  { value: "transfer", label: "Báo điều chuyển sang xe khác" },
  { value: "not_going", label: "Báo không đi nữa" },
  { value: "meal", label: "Phát sinh ăn uống" },
  { value: "lodging", label: "Phát sinh lưu trú" },
  { value: "late_missing", label: "Đến muộn / chưa thấy người" },
  { value: "health", label: "Sức khỏe / cần hỗ trợ" },
  { value: "other", label: "Phát sinh khác" },
];

const eventSchedule = [
  {
    day: "12.07.2026",
    items: [
      { time: "05:30", title: "Hà Nội xuất phát", detail: "Di chuyển tới Sầm Sơn, Thanh Hóa", icon: Bus },
      { time: "11:30", title: "Ăn trưa tại khách sạn", detail: "Ổn định đoàn theo xe", icon: Utensils },
      { time: "13:30", title: "Tập kết team building", detail: "Khu vực tổ chức chương trình", icon: MapPin },
      { time: "14:00", title: "Team building", detail: "Best Mode On", icon: Sparkles },
      { time: "15:35", title: "Về khách sạn check-in", detail: "Nhận phòng và nghỉ ngơi", icon: Hotel },
      { time: "17:00", title: "Di chuyển tới khách sạn Anyla", detail: "Chuẩn bị Gala Dinner", icon: Bus },
      { time: "18:30", title: "Gala Dinner", detail: "DANKO SHINE", icon: Sparkles },
    ],
  },
  {
    day: "13.07.2026",
    items: [
      { time: "Sáng", title: "Tự do tham quan, mua sắm", detail: "CBNV chủ động theo lịch đoàn", icon: MapPin },
      { time: "10:30 - 12:00", title: "Check-out và di chuyển ăn trưa", detail: "Hoàn tất trả phòng", icon: Utensils },
      { time: "13:30", title: "Di chuyển về Hà Nội và các tỉnh", detail: "Tập trung theo xe", icon: Bus },
    ],
  },
];

const uniqueVehicles = (records: CheckinRecord[]) =>
  Array.from(new Set(records.map((record) => String(record["Nhóm_xe"] || "").trim()).filter(Boolean)));

const issueLabel = (value?: string) => issueTypes.find((item) => item.value === value)?.label || value || "Phát sinh";

export default function LeaderVehiclePanel({ leaders, records, onReportIssue }: Props) {
  const vehicles = useMemo(() => uniqueVehicles(leaders), [leaders]);
  const vehicleOptions = useMemo(() => uniqueVehicles(records), [records]);
  const [vehicle, setVehicle] = useState(() => vehicles[0] || "");
  const [keyword, setKeyword] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [issueMember, setIssueMember] = useState<CheckinRecord | null>(null);
  const [issueType, setIssueType] = useState(issueTypes[0].value);
  const [issueVehicle, setIssueVehicle] = useState("");
  const [issueNote, setIssueNote] = useState("");

  const activeVehicle = vehicles.includes(vehicle) ? vehicle : vehicles[0] || "";
  const vehicleMembers = records.filter((record) => String(record["Nhóm_xe"] || "").trim() === activeVehicle);
  const filteredMembers = vehicleMembers.filter((record) => {
    if (!keyword.trim()) return true;
    return [record["Họ_và_tên"], record["Mã_NV"], record["SĐT"], record["Phòng_ban"], record["Đơn_vị"], record["Điểm_đón"]]
      .map(toSearchText)
      .some((value) => value.includes(toSearchText(keyword)));
  });

  if (!vehicles.length) return null;

  const copyPhone = async (member: CheckinRecord) => {
    const phone = String(member["SĐT"] || "").trim();
    if (!phone) return;
    await navigator.clipboard.writeText(phone);
    setCopiedId(String(member.Checkin_ID));
    window.setTimeout(() => setCopiedId(""), 1200);
  };

  const openIssueForm = (member: CheckinRecord) => {
    const currentVehicle = String(member["Nhóm_xe"] || "").trim();
    setIssueMember(member);
    setIssueType("transfer");
    setIssueVehicle(vehicleOptions.find((item) => item !== currentVehicle) || activeVehicle);
    setIssueNote("");
  };

  const closeIssueForm = () => setIssueMember(null);

  const submitIssue = () => {
    if (!issueMember) return;
    const reporter = leaders.map((leader) => leader["Họ_và_tên"]).filter(Boolean).join(", ");
    const targetVehicle = issueType === "transfer" ? issueVehicle.trim() : "";
    const previousNote = String(issueMember.Ghi_chu_noi_bo || "").trim();
    const nextLine = [
      new Date().toLocaleString("vi-VN"),
      reporter ? `Trưởng xe: ${reporter}` : "Trưởng xe",
      issueLabel(issueType),
      targetVehicle ? `Xe đề xuất: ${targetVehicle}` : "",
      issueNote.trim(),
    ]
      .filter(Boolean)
      .join(" | ");

    onReportIssue(String(issueMember.Checkin_ID), {
      Loai_phat_sinh: issueType,
      Trang_thai_phat_sinh: "Chờ Admin xử lý",
      Xe_de_xuat: targetVehicle,
      Thoi_gian_phat_sinh: new Date().toISOString(),
      Nguoi_bao_phat_sinh: reporter,
      Ghi_chu_noi_bo: previousNote ? `${previousNote}\n${nextLine}` : nextLine,
    });
    closeIssueForm();
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
      <div className="border-b border-blue-50 bg-blue-50/70 p-3 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Bus className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-blue-700">Bảng Trưởng xe</p>
            <h2 className="truncate text-lg font-black text-slate-950 sm:text-xl">{activeVehicle}</h2>
            <p className="truncate text-xs font-semibold text-slate-600">
              {vehicleMembers.length} thành viên • Theo dõi danh sách và báo phát sinh
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-3 sm:p-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
          <div className="mb-2 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-700" />
            <p className="text-sm font-black uppercase tracking-wide text-slate-700">Lịch trình sự kiện</p>
          </div>
          <div className="space-y-3">
            {eventSchedule.map((day) => (
              <div key={day.day}>
                <p className="mb-1.5 inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-blue-700 ring-1 ring-blue-100">
                  Ngày {day.day}
                </p>
                <div className="grid gap-1.5">
                  {day.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={`${day.day}-${item.time}-${item.title}`} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 ring-1 ring-slate-100">
                        <span className="w-16 shrink-0 text-xs font-black text-slate-900">{item.time}</span>
                        <Icon className="h-4 w-4 shrink-0 text-blue-600" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-black text-slate-950 sm:text-sm">{item.title}</p>
                          <p className="truncate text-[11px] font-semibold text-slate-500">{item.detail}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[220px_1fr]">
          {vehicles.length > 1 ? (
            <select
              value={activeVehicle}
              onChange={(event) => setVehicle(event.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {vehicles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          ) : null}

          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Tìm tên, SĐT, mã NV, điểm đón..."
            />
          </label>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-black uppercase tracking-wider text-slate-500">Danh sách thành viên xe</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
            <UsersRound className="h-3.5 w-3.5" />
            {filteredMembers.length} người
          </span>
        </div>

        <div className="space-y-1.5">
          {filteredMembers.map((member) => {
            const pendingIssue = member.Trang_thai_phat_sinh === "Chờ Admin xử lý";
            return (
              <article
                key={member.Checkin_ID}
                className={`flex min-h-12 items-center justify-between gap-2 rounded-xl border px-2.5 py-1.5 ${
                  pendingIssue ? "border-amber-200 bg-amber-50/80" : "border-slate-200 bg-white"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black leading-5 text-slate-950">{member["Họ_và_tên"] || "Chưa có tên"}</p>
                  <p className="truncate text-[11px] font-semibold leading-4 text-slate-500">
                    {member["Điểm_đón"] || "Chưa có điểm đón"} • {member["Phòng_ban"] || member["Đơn_vị"] || "Chưa có đơn vị"}
                  </p>
                  {pendingIssue ? <p className="truncate text-[11px] font-black text-amber-700">{issueLabel(member.Loai_phat_sinh)} đang chờ Admin</p> : null}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => copyPhone(member)}
                    disabled={!member["SĐT"]}
                    title={member["SĐT"] ? "Copy số điện thoại" : "Chưa có số điện thoại"}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {copiedId === String(member.Checkin_ID) ? <CopyCheck className="h-4 w-4 text-emerald-600" /> : <PhoneCall className="h-4 w-4" />}
                  </button>

                  <button
                    onClick={() => openIssueForm(member)}
                    title={pendingIssue ? "Đã báo phát sinh" : "Báo phát sinh"}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition ${
                      pendingIssue ? "border-amber-200 bg-amber-100 text-amber-700" : "border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:text-amber-700"
                    }`}
                  >
                    {pendingIssue ? <AlertTriangle className="h-4 w-4" /> : <FilePenLine className="h-4 w-4" />}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {issueMember ? (
        <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-4 sm:items-center sm:justify-center">
          <div className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-amber-600">Báo phát sinh</p>
                <h3 className="mt-1 text-lg font-black text-slate-950">{issueMember["Họ_và_tên"] || "Chưa có tên"}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">Xe hiện tại: {issueMember["Nhóm_xe"] || "-"}</p>
              </div>
              <button onClick={closeIssueForm} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                Loại phát sinh
                <select
                  value={issueType}
                  onChange={(event) => setIssueType(event.target.value)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {issueTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              {issueType === "transfer" ? (
                <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Xe đề xuất chuyển sang
                  <select
                    value={issueVehicle}
                    onChange={(event) => setIssueVehicle(event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {vehicleOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="text-xs font-black uppercase tracking-wide text-slate-500">
                Ghi chú cho Admin
                <textarea
                  value={issueNote}
                  onChange={(event) => setIssueNote(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Nhập nội dung cần xử lý..."
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeIssueForm} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">
                Hủy
              </button>
              <button onClick={submitIssue} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-black text-white hover:bg-amber-600">
                <Send className="h-4 w-4" />
                Gửi Admin
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
