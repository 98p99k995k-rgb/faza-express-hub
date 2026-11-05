import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { PlaceDirectory } from "@/components/PlaceDirectory";

export const Route = createFileRoute("/cafes")({
  head: () => ({ meta: [{ title: "الكافيهات – فزعة" }] }),
  component: CafesPage,
});

function CafesPage() {
  return (
    <>
      <PlaceDirectory category="cafes" />
      <BottomNav />
    </>
  );
}
