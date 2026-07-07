import { Check, ChevronDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toSearchText } from "../utils/format";

type Props = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
};

type Group = {
  label: string;
  options: string[];
};

const groupVehicle = (vehicle: string) => {
  const normalized = toSearchText(vehicle);
  if (vehicle === "Tất cả") return "Tổng quan";
  if (["ha noi", "tuyen quang", "thanh hoa", "tu tuc"].includes(normalized)) return "Khu vực";
  if (normalized.includes("khach") || normalized.includes("bld") || normalized.includes("pv") || normalized.includes("dsea") || normalized.includes("dstyle")) {
    return "Xe sự kiện";
  }
  if (normalized.startsWith("bg") || normalized.startsWith("dk") || normalized.startsWith("th") || normalized.startsWith("tq")) {
    return "Xe ngoại tỉnh";
  }
  return "Xe nội bộ";
};

const buildGroups = (options: string[], query: string): Group[] => {
  const q = toSearchText(query);
  const filtered = options.filter((option) => !q || toSearchText(option).includes(q));
  const grouped = filtered.reduce<Record<string, string[]>>((groups, option) => {
    const key = groupVehicle(option);
    groups[key] = groups[key] || [];
    groups[key].push(option);
    return groups;
  }, {});

  const order = ["Tổng quan", "Khu vực", "Xe sự kiện", "Xe nội bộ", "Xe ngoại tỉnh"];
  return order
    .map((label) => ({ label, options: grouped[label] || [] }))
    .filter((group) => group.options.length > 0);
};

export default function VehicleCombobox({ options, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const groups = useMemo(() => buildGroups(options, query), [options, query]);

  const selectOption = (option: string) => {
    onChange(option);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 text-left shadow-sm transition hover:border-blue-200 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Nhóm xe</span>
          <span className="block truncate text-sm font-black text-blue-700">{value}</span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <label className="relative block border-b border-slate-100">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              autoFocus
              className="h-12 w-full bg-white pl-10 pr-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
              placeholder="Tìm nhanh mã xe..."
            />
          </label>

          <div className="max-h-80 overflow-y-auto py-2">
            {groups.length ? (
              groups.map((group) => (
                <div key={group.label} className="py-1">
                  <p className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">{group.label}</p>
                  {group.options.map((option) => {
                    const selected = option === value;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => selectOption(option)}
                        className={`flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm font-bold transition ${
                          selected ? "bg-blue-50 text-blue-700" : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{option}</span>
                        {selected ? <Check className="h-4 w-4 shrink-0" /> : null}
                      </button>
                    );
                  })}
                </div>
              ))
            ) : (
              <p className="px-3 py-4 text-sm font-semibold text-slate-500">Không tìm thấy nhóm xe phù hợp.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
