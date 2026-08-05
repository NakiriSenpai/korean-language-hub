import { Loading } from "@/shared/components/Loading";

/** Global route-level loading screen used by router pending states. */
export function RouteLoading() {
  return (
    <div className="flex min-h-[50dvh] w-full items-center justify-center">
      <Loading label="Memuat halaman…" />
    </div>
  );
}
