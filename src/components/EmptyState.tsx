type Props = {
  title: string;
  detail?: string;
};

export default function EmptyState({ title, detail }: Props) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 bg-white px-4 py-8 text-center">
      <p className="text-base font-semibold text-stone-800">{title}</p>
      {detail ? <p className="mt-2 text-sm text-stone-500">{detail}</p> : null}
    </div>
  );
}
