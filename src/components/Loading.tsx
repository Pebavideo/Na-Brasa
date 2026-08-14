export function Loading({ texto = 'Carregando...' }: { texto?: string }) {
  return (
    <div className="flex h-full min-h-[50vh] w-full flex-col items-center justify-center gap-3 text-zinc-500">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-orange-600" />
      <p className="text-sm font-medium">{texto}</p>
    </div>
  )
}
