export default function ExploreLoading() {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="h-9 w-32 bg-skeleton rounded-lg" />
      <div className="h-5 w-96 max-w-full bg-skeleton rounded-md mt-4 mb-8" />
      <div className="h-12 w-full bg-skeleton rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
            <div className="h-4 w-40 bg-skeleton rounded" />
            <div className="h-6 w-full bg-skeleton rounded" />
            <div className="h-4 w-24 bg-skeleton rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
