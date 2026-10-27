/** Shimmer placeholder shown on the canvas before the first layout arrives. */
export function CanvasSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl" aria-hidden="true">
      <div className="shimmer mb-5 h-16 w-3/4" />
      <div className="shimmer mb-10 h-6 w-1/2" />
      <div
        className="mb-10 grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))" }}
      >
        <div className="shimmer h-36" />
        <div className="shimmer h-36" />
        <div className="shimmer h-36" />
      </div>
      <div className="shimmer mb-3 h-5 w-full" />
      <div className="shimmer h-5 w-5/6" />
    </div>
  );
}
