export default function EmptyState({ icone: Icone, titre, sous }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {Icone && (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-100 text-surface-400 mb-4">
          <Icone size={22} strokeWidth={1.5} />
        </div>
      )}
      <p className="text-sm font-medium text-surface-600">{titre}</p>
      {sous && <p className="mt-1 text-xs text-surface-400 max-w-xs">{sous}</p>}
    </div>
  );
}
