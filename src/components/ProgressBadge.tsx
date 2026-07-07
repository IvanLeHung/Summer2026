import { ActivityStats } from "../types/checkin";

type Props = {
  stats: ActivityStats;
};

export default function ProgressBadge({ stats }: Props) {
  const tone =
    stats.total === 0
      ? "bg-stone-200 text-stone-700"
      : stats.missing === 0
        ? "bg-emerald-100 text-emerald-800"
        : stats.percent < 50
          ? "bg-rose-100 text-rose-800"
          : "bg-sky-100 text-sky-800";

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
      {stats.checked}/{stats.total} ({Math.round(stats.percent)}%)
    </span>
  );
}
