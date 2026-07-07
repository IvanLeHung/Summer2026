import { AlertTriangle, ArrowRightLeft, CheckCircle2, XCircle } from "lucide-react";
import { CheckinRecord } from "../types/checkin";
import { toSearchText } from "../utils/format";

type Props = {
  records: CheckinRecord[];
  onUpdateProfile: (id: string, updates: Partial<CheckinRecord>) => void;
};

const issueLabels: Record<string, string> = {
  transfer: "Báo điều chuyển",
  not_going: "Báo không đi nữa",
  meal: "Phát sinh ăn uống",
  lodging: "Phát sinh lưu trú",
  late_missing: "Đến muộn / chưa thấy người",
  health: "Sức khỏe / cần hỗ trợ",
  other: "Phát sinh khác",
};

const issueLabel = (value?: string) => (value ? issueLabels[value] || value : "Phát sinh");

const pendingText = (value?: string) => {
  const normalized = toSearchText(value);
  return normalized.includes("admin") && !normalized.includes("da xu ly");
};

const appendActionNote = (member: CheckinRecord, action: string) => {
  const previousNote = String(member.Ghi_chu_noi_bo || "").trim();
  const nextLine = `${new Date().toLocaleString("vi-VN")} | Admin: ${action}`;
  return previousNote ? `${previousNote}\n${nextLine}` : nextLine;
};

const clearIssueFields = {
  Loai_phat_sinh: "",
  Trang_thai_phat_sinh: "",
  Xe_de_xuat: "",
  Thoi_gian_phat_sinh: "",
  Nguoi_bao_phat_sinh: "",
};

export default function AdminIssueQueue({ records, onUpdateProfile }: Props) {
  const issues = records.filter((record) => pendingText(record.Trang_thai_phat_sinh));

  if (!issues.length) return null;

  const resolveIssue = (member: CheckinRecord, action: "transfer" | "not_going" | "done" | "dismiss") => {
    if (action === "dismiss") {
      onUpdateProfile(String(member.Checkin_ID), {
        ...clearIssueFields,
        Ghi_chu_noi_bo: appendActionNote(member, "Bỏ báo phát sinh"),
      });
      return;
    }

    if (action === "transfer") {
      const vehicle = String(member.Xe_de_xuat || "").trim();
      if (!vehicle) return;
      onUpdateProfile(String(member.Checkin_ID), {
        ["Nhóm_xe"]: vehicle,
        ["Có_đi_xe"]: !toSearchText(vehicle).includes("tu tuc"),
        Trang_thai_phat_sinh: "Đã xử lý",
        Ghi_chu_noi_bo: appendActionNote(member, `Đã điều chuyển sang xe ${vehicle}`),
      });
      return;
    }

    if (action === "not_going") {
      onUpdateProfile(String(member.Checkin_ID), {
        ["Nhóm_xe"]: "Tự túc - Không đi",
        ["Có_đi_xe"]: false,
        Trang_thai_phat_sinh: "Đã xử lý",
        Ghi_chu_noi_bo: appendActionNote(member, "Xác nhận không đi nữa"),
      });
      return;
    }

    onUpdateProfile(String(member.Checkin_ID), {
      Trang_thai_phat_sinh: "Đã xử lý",
      Ghi_chu_noi_bo: appendActionNote(member, `Đã xử lý: ${issueLabel(member.Loai_phat_sinh)}`),
    });
  };

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wider text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            Chờ Admin phê duyệt
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{issues.length} phát sinh cần xử lý</h2>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {issues.map((member) => {
          const currentVehicle = String(member["Nhóm_xe"] || "-");
          const proposedVehicle = String(member.Xe_de_xuat || "").trim();
          return (
            <article key={member.Checkin_ID} className="rounded-xl border border-amber-200 bg-white p-3 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-black text-slate-950">{member["Họ_và_tên"] || "Chưa có tên"}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">
                    {issueLabel(member.Loai_phat_sinh)} • Xe hiện tại: {currentVehicle}
                    {proposedVehicle ? ` • Xe đề xuất: ${proposedVehicle}` : ""}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Người báo: {member.Nguoi_bao_phat_sinh || "Trưởng xe"} • {member.Thoi_gian_phat_sinh ? new Date(member.Thoi_gian_phat_sinh).toLocaleString("vi-VN") : ""}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {member.Loai_phat_sinh === "transfer" && proposedVehicle ? (
                    <button onClick={() => resolveIssue(member, "transfer")} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white hover:bg-blue-700">
                      <ArrowRightLeft className="h-3.5 w-3.5" />
                      Chuyển xe
                    </button>
                  ) : null}
                  {member.Loai_phat_sinh === "not_going" ? (
                    <button onClick={() => resolveIssue(member, "not_going")} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-black text-white hover:bg-rose-700">
                      Không đi nữa
                    </button>
                  ) : null}
                  <button onClick={() => resolveIssue(member, "done")} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Đã xử lý
                  </button>
                  <button onClick={() => resolveIssue(member, "dismiss")} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50">
                    <XCircle className="h-3.5 w-3.5" />
                    Bỏ báo
                  </button>
                </div>
              </div>

              {member.Ghi_chu_noi_bo ? <div className="mt-3 rounded-lg bg-slate-50 p-2 text-xs font-semibold leading-5 text-slate-600">{member.Ghi_chu_noi_bo}</div> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
