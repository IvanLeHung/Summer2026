import { AlertTriangle, Bus, CheckCircle2, Circle, CopyCheck, FilePenLine, PhoneCall, Search, Send, UsersRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import { activities } from "../config/activities";
import { CheckinRecord } from "../types/checkin";
import { getApplicableRecords, isCheckedIn } from "../utils/checkin";
import { toSearchText } from "../utils/format";

type Props = {
  leaders: CheckinRecord[];
  records: CheckinRecord[];
  onReportIssue: (personId: string, updates: Partial<CheckinRecord>) => void;
};

type StatusFilter = "all" | "done" | "missing";

const issueTypes = [
  { value: "transfer", label: "Báo điều chuyển sang xe khác" },
  { value: "not_going", label: "Báo không đi nữa" },
  { value: "meal", label: "Phát sinh ăn uống" },
  { value: "lodging", label: "Phát sinh lưu trú" },
  { value: "late_missing", label: "Đến muộn / chưa thấy người" },
  { value: "health", label: "Sức khỏe / cần hỗ trợ" },
  { value: "other", label: "Phát sinh khác" },
];

const uniqueVehicles = (records: CheckinRecord[]) =>
  Array.from(new Set(records.map((record) => String(record["Nhóm_xe"] || "").trim()).filter(Boolean)));

const issueLabel = (value?: string) => issueTypes.find((item) => item.value === value)?.label || value || "Phát sinh";

export default function LeaderVehiclePanel({ leaders, records, onReportIssue }: Props) {
  const vehicles = useMemo(() => uniqueVehicles(leaders), [leaders]);
  const vehicleOptions = useMemo(() => uniqueVehicles(records), [records]);
  const [vehicle, setVehicle] = useState(() => vehicles[0] || "");
  const [activityId, setActivityId] = useState(activities[0]?.id || "");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [copiedId, setCopiedId] = useState("");
  const [issueMember, setIssueMember] = useState<CheckinRecord | null>(null);
  const [issueType, setIssueType] = useState(issueTypes[0].value);
  const [issueVehicle, setIssueVehicle] = useState("");
  const [issueNote, setIssueNote] = useState("");

  const activeVehicle = vehicles.includes(vehicle) ? vehicle : vehicles[0] || "";
  const activity = activities.find((item) => item.id === activityId) || activities[0];
  const vehicleMembers = records.filter((record) => String(record["Nhóm_xe"] || "").trim() === activeVehicle);
  const applicableMembers = activity ? getApplicableRecords(vehicleMembers, activity) : vehicleMembers;
  const filteredMembers = applicableMembers.filter((record) => {
    const checked = activity ? isCheckedIn(record, activity) : false;
    if (status === "done" && !checked) return false;
    if (status === "missing" && checked) return false;
    if (!keyword.trim()) return true;
    return [record["Họ_và_tên"], record["Mã_NV"], record["SĐT"], record["Phòng_ban"], record["Đơn_vị"], record["Điểm_đón"]]
      .map(toSearchText)
      .some((value) => value.includes(toSearchText(keyword)));
  });
  const checkedCount = activity ? applicableMembers.filter((record) => isCheckedIn(record, activity)).length : 0;
  const missingCount = applicableMembers.length - checkedCount;
  const percent = applicableMembers.length ? Math.round((checkedCount / applicableMembers.length) * 100) : 0;

  if (!vehicles.length || !activity) return null;

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
      <div className="border-b border-blue-50 bg-blue-50/70 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <Bus className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black uppercase tracking-wider text-blue-700">Bảng trưởng xe</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{activeVehicle}</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">Theo dõi check-in và báo phát sinh cho Admin xử lý.</p>
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

        <div className="space-y-1.5">
          {filteredMembers.map((member) => {
            const checked = isCheckedIn(member, activity);
            const pendingIssue = member.Trang_thai_phat_sinh === "Chờ Admin xử lý";
            return (
              <article
                key={member.Checkin_ID}
                className={`flex min-h-14 items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                  checked ? "border-emerald-100 bg-emerald-50/70" : pendingIssue ? "border-amber-200 bg-amber-50/70" : "border-slate-200 bg-white"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-950">{member["Họ_và_tên"] || "Chưa có tên"}</p>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {member["Điểm_đón"] || "Chưa có điểm đón"} • {member["Phòng_ban"] || member["Đơn_vị"] || "Chưa có đơn vị"}
                  </p>
                  {pendingIssue ? <p className="mt-0.5 truncate text-xs font-black text-amber-700">{issueLabel(member.Loai_phat_sinh)} đang chờ Admin</p> : null}
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
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

                  {activities.map((item) => {
                    const done = isCheckedIn(member, item);
                    return (
                      <span
                        key={item.id}
                        title={item.label}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black ${
                          done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-3.5 w-3.5" />}
                      </span>
                    );
                  })}
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
