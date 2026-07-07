import { BarChart3, Clock3, FileDown, FileUp, LogOut, Shield, TestTube2 } from "lucide-react";
import { ChangeEvent, useRef } from "react";
import { activities } from "../config/activities";
import { Role, canExport, canImport, canViewReport } from "../config/permissions";

type Props = {
  role: Role;
  onOpenPin: () => void;
  onLogout: () => void;
  onImport: (file: File) => void;
  onExport: () => void;
  onToggleReport: () => void;
  showReport: boolean;
  uatMode: boolean;
  uatNow: string;
  onToggleUat: () => void;
  onUatNowChange: (value: string) => void;
  onUseRealTime: () => void;
};

export default function AdminPanel({
  role,
  onOpenPin,
  onLogout,
  onImport,
  onExport,
  onToggleReport,
  showReport,
  uatMode,
  uatNow,
  onToggleUat,
  onUatNowChange,
  onUseRealTime,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImport(file);
    event.target.value = "";
  };

  if (role === "staff") {
    return (
      <button
        onClick={onOpenPin}
        className="fixed right-3 top-3 z-30 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-stone-700 shadow-sm ring-1 ring-stone-200"
      >
        <Shield className="h-4 w-4" />
        Admin
      </button>
    );
  }

  return (
    <div className="sticky top-0 z-30 -mx-4 border-b border-stone-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2">
        <span className="mr-auto rounded-full bg-stone-950 px-3 py-2 text-xs font-bold text-white">Admin</span>
        <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
        {canImport(role) ? (
          <button onClick={() => inputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold">
            <FileUp className="h-4 w-4" />
            Import
          </button>
        ) : null}
        {canExport(role) ? (
          <button onClick={onExport} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold">
            <FileDown className="h-4 w-4" />
            Export
          </button>
        ) : null}
        {canViewReport(role) ? (
          <button
            onClick={onToggleReport}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${showReport ? "bg-brand-600 text-white" : ""}`}
          >
            <BarChart3 className="h-4 w-4" />
            Báo cáo
          </button>
        ) : null}
        <button
          onClick={onToggleUat}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold ${uatMode ? "border-amber-300 bg-amber-100 text-amber-900" : ""}`}
        >
          <TestTube2 className="h-4 w-4" />
          UAT
        </button>
        {uatMode ? (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5">
            <Clock3 className="h-4 w-4 text-amber-800" />
            <input
              type="datetime-local"
              value={uatNow}
              onChange={(event) => onUatNowChange(event.target.value)}
              className="h-9 rounded-md border border-amber-200 bg-white px-2 text-sm font-bold text-amber-950"
            />
            <button onClick={onUseRealTime} className="rounded-md bg-white px-2.5 py-2 text-xs font-black text-amber-900 ring-1 ring-amber-200">
              Giờ thật
            </button>
            {activities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => onUatNowChange(activity.opensAt ? activity.opensAt.slice(0, 16) : "")}
                className="rounded-md bg-amber-100 px-2.5 py-2 text-xs font-black text-amber-950 ring-1 ring-amber-200"
              >
                Test {activity.shortLabel}
              </button>
            ))}
          </div>
        ) : null}
        <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold text-rose-700">
          <LogOut className="h-4 w-4" />
          Thoát
        </button>
      </div>
    </div>
  );
}
