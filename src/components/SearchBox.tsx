import { Search } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBox({ value, onChange }: Props) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-500" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-14 w-full rounded-lg border border-blue-100 bg-white pl-12 pr-4 text-base font-bold text-slate-900 shadow-md outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        placeholder="Tìm tên, mã NV, SĐT, phòng ban..."
      />
    </label>
  );
}
