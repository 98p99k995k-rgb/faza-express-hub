import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/welcome")({
  component: WelcomePage,
});

const welcomeBackground = "/b5954f9c-12be-4e81-9b87-9981805079b4.png";

function WelcomePage() {
  const navigate = useNavigate();
  const { completeWelcome, profile } = useStore();

  const handleStart = () => {
    completeWelcome();
    navigate({ to: profile ? "/" : "/auth" });
  };

  return (
    <div className="min-h-screen bg-[#f4f0ea]">
      <div
        role="button"
        tabIndex={0}
        onClick={handleStart}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleStart();
          }
        }}
        className="relative mx-auto h-[100dvh] w-full max-w-[430px] cursor-pointer touch-manipulation select-none bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("${welcomeBackground}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        aria-label="ابدأ الآن"
      />
    </div>
  );
}
