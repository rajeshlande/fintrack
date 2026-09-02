export default function RootLoading() {
  return (
    <div className="app-bg min-h-dvh safe-area-padding" aria-busy="true" aria-label="Loading">
      <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8 pt-8 animate-pulse">
        <div className="h-8 w-48 bg-black/5 rounded-xl mb-2" />
        <div className="h-4 w-64 bg-black/5 rounded-lg mb-8" />
        <div className="h-40 bg-black/5 rounded-3xl mb-6" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 bg-black/5 rounded-2xl" />
          <div className="h-24 bg-black/5 rounded-2xl" />
          <div className="h-24 bg-black/5 rounded-2xl" />
          <div className="h-24 bg-black/5 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
