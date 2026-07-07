import { FormEvent, useMemo, useState } from "react";
import { CheckCircle, X } from "lucide-react";
import { ActivityConfig, CheckinRecord } from "../types/checkin";
import { hasUserVerification, verifyUserCredential } from "../utils/checkin";

type Props = {
  person: CheckinRecord;
  activity: ActivityConfig;
  onClose: () => void;
  onConfirm: (verifiedBy: string) => void;
};

export default function UserVerificationModal({ person, activity, onClose, onConfirm }: Props) {
  const [credential, setCredential] = useState("");
  const [error, setError] = useState("");
  const canVerify = useMemo(() => hasUserVerification(person), [person]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canVerify) {
      setError("Hồ sơ này chưa có SĐT hoặc mã NV để xác thực. Vui lòng liên hệ BTC/Admin.");
      return;
    }

    const result = verifyUserCredential(person, credential);
    if (!result.ok) {
      setError("Thông tin xác thực không khớp.");
      return;
    }

    onConfirm(result.method);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-stone-950/45 px-3 pb-3 sm:place-items-center sm:p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-brand-700">Xác thực người tham gia</p>
            <h2 className="mt-1 text-xl font-extrabold text-stone-950">{person.Họ_và_tên || "Người tham gia"}</h2>
            <p className="mt-1 text-sm font-semibold text-stone-500">{activity.label}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-stone-500 active:bg-stone-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 rounded-lg bg-stone-50 p-3 text-sm text-stone-700">
          Nhập <span className="font-bold">4 số cuối SĐT</span> hoặc <span className="font-bold">mã NV đầy đủ</span> do người tham gia cung cấp.
        </div>

        <input
          autoFocus
          value={credential}
          onChange={(event) => {
            setCredential(event.target.value);
            setError("");
          }}
          className="mt-4 h-14 w-full rounded-lg border border-stone-300 px-4 text-center text-lg font-bold outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          placeholder="VD: 0668 hoặc DK000180"
        />

        {error ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">{error}</p> : null}

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="h-12 flex-1 rounded-lg border border-stone-300 font-bold text-stone-700">
            Đóng
          </button>
          <button className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 font-extrabold text-white active:bg-brand-700">
            <CheckCircle className="h-5 w-5" />
            Xác thực
          </button>
        </div>
      </form>
    </div>
  );
}
