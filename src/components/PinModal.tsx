import { X } from "lucide-react";
import { FormEvent, useState } from "react";
import { ADMIN_PIN } from "../config/permissions";

type Props = {
  onClose: () => void;
  onSuccess: () => void;
};

export default function PinModal({ onClose, onSuccess }: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (pin === ADMIN_PIN) {
      onSuccess();
      return;
    }
    setError("PIN không đúng.");
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-stone-950/40 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-stone-950">Vào Admin</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-stone-500 active:bg-stone-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <input
          autoFocus
          inputMode="numeric"
          type="password"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          className="mt-4 h-12 w-full rounded-lg border border-stone-300 px-4 text-center text-xl font-bold tracking-[0.3em] outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
          placeholder="PIN"
        />
        {error ? <p className="mt-2 text-sm font-semibold text-rose-700">{error}</p> : null}
        <button className="mt-4 h-12 w-full rounded-lg bg-stone-950 font-bold text-white active:bg-stone-800">Xác nhận</button>
      </form>
    </div>
  );
}
