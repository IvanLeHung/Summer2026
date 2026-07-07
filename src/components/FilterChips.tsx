type Props = {
  chips: string[];
  active: string;
  onChange: (chip: string) => void;
};

export default function FilterChips({ chips, active, onChange }: Props) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      {chips.map((chip) => (
        <button
          key={chip}
          onClick={() => onChange(chip)}
          className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
            active === chip
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-stone-300 bg-white text-stone-700 active:bg-stone-100"
          }`}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
