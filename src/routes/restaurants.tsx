import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { PlaceDirectory } from "@/components/PlaceDirectory";

export const Route = createFileRoute("/restaurants")({
  head: () => ({ meta: [{ title: "المطاعم – فزعة" }] }),
  component: RestaurantsPage,
});

function RestaurantsPage() {
  return (
    <>
      <PlaceDirectory category="restaurants" />
      <BottomNav />
    </>
  );
}
