export default function SectionHeader({ titre, sous, action }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-surface-900 tracking-tight">{titre}</h2>
        {sous && <p className="mt-0.5 text-xs text-surface-400">{sous}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
