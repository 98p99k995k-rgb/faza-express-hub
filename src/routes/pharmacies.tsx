import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { PlaceDirectory } from "@/components/PlaceDirectory";

export const Route = createFileRoute("/pharmacies")({
  head: () => ({ meta: [{ title: "الصيدليات – فزعة" }] }),
  component: PharmaciesPage,
});

function PharmaciesPage() {
  return (
    <>
      <PlaceDirectory category="pharmacies" />
      <BottomNav />
    </>
  );
}
