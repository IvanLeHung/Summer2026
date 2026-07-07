import { ArrowLeft, QrCode } from "lucide-react";
import { useMemo, useState } from "react";
import { Role } from "../config/permissions";
import { ActivityConfig, CheckinRecord } from "../types/checkin";
import { getApplicableRecords, getVehicleChips, searchRecords } from "../utils/checkin";
import { toSearchText } from "../utils/format";
import EmptyState from "./EmptyState";
import FilterChips from "./FilterChips";
import PersonCard from "./PersonCard";
import SearchBox from "./SearchBox";
import VehicleCombobox from "./VehicleCombobox";

type Props = {
  records: CheckinRecord[];
  activity: ActivityConfig;
  role: Role;
  onBack: () => void;
  onCheckIn: (id: string) => void;
  onCancel: (id: string) => void;
  onUpdateProfile: (id: string, updates: Partial<CheckinRecord>) => void;
};

export default function QuickCheckin({ records, activity, role, onBack, onCheckIn, onCancel, onUpdateProfile }: Props) {
  const [keyword, setKeyword] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("Tất cả");
  const applicable = useMemo(() => getApplicableRecords(records, activity), [records, activity]);
  const chips = useMemo(() => getVehicleChips(records), [records]);
  const useDropdownFilter = chips.length > 8;

  const filtered = useMemo(() => {
    const searched = searchRecords(applicable, keyword);
    if (vehicleFilter === "Tất cả") return searched;
    return searched.filter((record) => toSearchText(record.Nhóm_xe).includes(toSearchText(vehicleFilter)));
  }, [applicable, keyword, vehicleFilter]);

  const scanQr = () => {
    window.alert("Scan QR sẽ được kết nối camera ở bước triển khai tiếp theo.");
  };

  return (
    <section className="space-y-4">
      <div className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur">
        <button onClick={onBack} className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-slate-700">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">Hoạt động</p>
            <h2 className="text-xl font-extrabold text-slate-950">{activity.label}</h2>
          </div>
          <p className="rounded-full bg-white px-3 py-1.5 text-xs font-black uppercase tracking-wide text-slate-500 ring-1 ring-slate-200">
            {filtered.length}/{applicable.length} nhân viên
          </p>
        </div>
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <SearchBox value={keyword} onChange={setKeyword} />
          </div>
          <button
            onClick={scanQr}
            className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
          >
            <QrCode className="h-5 w-5" />
            <span className="hidden sm:inline">Scan QR</span>
          </button>
        </div>
      </div>

      {useDropdownFilter ? (
        <VehicleCombobox options={chips} value={vehicleFilter} onChange={setVehicleFilter} />
      ) : (
        <FilterChips chips={chips} active={vehicleFilter} onChange={setVehicleFilter} />
      )}

      {!applicable.length ? (
        <EmptyState title="Không có ai cần check-in cho hoạt động này" />
      ) : !filtered.length ? (
        <EmptyState title="Không tìm thấy người phù hợp" />
      ) : (
        <div className="space-y-2">
          {filtered.map((person) => (
            <PersonCard
              key={person.Checkin_ID}
              person={person}
              activity={activity}
              role={role}
              onCheckIn={onCheckIn}
              onCancel={onCancel}
              onUpdateProfile={onUpdateProfile}
            />
          ))}
        </div>
      )}
    </section>
  );
}
