import { FormEvent, useState } from "react";
import { AlertTriangle, ArrowRight, Phone } from "lucide-react";
import EmptyState from "./EmptyState";

type Props = {
  hasData: boolean;
  onSubmit: (phone: string) => void;
};

export default function UserWelcome({ hasData, onSubmit }: Props) {
  const [phone, setPhone] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(phone);
  };

  if (!hasData) {
    return <EmptyState title="Chưa có dữ liệu. Vui lòng liên hệ BTC." />;
  }

  const hasPhone = phone.trim().length > 0;

  return (
    <section className="mx-auto flex min-h-[68vh] max-w-lg items-center">
      <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="relative h-36 overflow-hidden bg-brand-50 sm:h-44">
          <img
            src="/travel-banner-2026.png"
            alt="Danko Group Mùa Du Lịch 2026"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-brand-950/35 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5">
            <div className="inline-block rounded-2xl bg-slate-950/45 px-4 py-3 shadow-lg backdrop-blur-sm ring-1 ring-white/20">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white">Danko Group</p>
              <p className="mt-1 text-xl font-black text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_0.55)]">Mùa Du Lịch 2026</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-7">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand-600">Danko Group</p>
          <h1 className="mt-3 text-2xl font-bold leading-snug text-slate-950">Chào mừng đến với</h1>
          <h2 className="mt-1 text-3xl font-black leading-tight text-brand-700">Mùa Du Lịch 2026</h2>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            Chào mừng các thành viên của Tập đoàn Danko Group! Các bạn đã thực sự sẵn sàng cho kỳ nghỉ tuyệt vời năm nay chưa? Trước tiên, hãy vui lòng thực hiện <span className="font-bold text-slate-800">check-in đúng hạn</span> để hành trình diễn ra suôn sẻ và đảm bảo quyền lợi.
          </p>
          <div className="mt-5 rounded-r-2xl border-l-4 border-amber-400 bg-amber-50 p-4 text-left">
            <div className="flex gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
              <div>
                <p className="text-sm font-bold text-amber-900">Quy định bắt buộc</p>
                <p className="mt-1 text-xs leading-5 text-amber-900">
                  CBNV thực hiện check-in đầy đủ trước mỗi hoạt động. Hệ thống ghi nhận lịch sử để tổng kết, vui lòng hoàn thành <span className="font-bold">đúng thời gian</span> để tránh các trường hợp xử lý theo quy chế chung của Công ty.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="mt-7 space-y-4">
          <label className="group relative block">
            <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition group-focus-within:text-brand-600" />
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              className="peer h-16 w-full rounded-2xl border border-slate-200 bg-white px-4 pb-2 pl-12 pt-6 text-lg font-bold text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              placeholder=" "
            />
            <span
              className={`pointer-events-none absolute left-12 transition-all ${
                hasPhone
                  ? "top-2 text-xs font-bold text-brand-600"
                  : "top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-bold peer-focus:text-brand-600"
              }`}
            >
              Nhập số điện thoại đã đăng ký với BTC
            </span>
          </label>
          <button className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-600 text-base font-extrabold text-white shadow-sm transition hover:bg-brand-700 active:bg-brand-700">
            Tiếp tục
            <ArrowRight className="h-5 w-5" />
          </button>
        </form>
        </div>
      </div>
    </section>
  );
}
