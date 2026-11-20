export function RouteLoading({ label = "Loading KATALYST…" }: { label?: string }) {
  return <main className="route-loading" role="status" aria-busy="true"><span className="eyebrow">KATALYST</span><p>{label}</p></main>;
}
