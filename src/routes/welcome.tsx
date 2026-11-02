import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [{ title: "أهلاً بك في فزعة" }],
  }),
  component: WelcomePage,
});

const welcomeBackground = "/768de7f0-7b6a-47e6-af23-a2ffa61cff76.png";

function WelcomePage() {
  const navigate = useNavigate();
  const { completeWelcome } = useStore();

  const handleStart = () => {
    completeWelcome();
    navigate({ to: "/" });
  };

  return (
    <main className="welcome-screen relative mx-auto h-[100dvh] min-h-[100svh] w-full max-w-[430px] overflow-hidden bg-[#f7e9ff]">
      <img
        src={welcomeBackground}
        alt="فزعة، كل طلباتك أسرع وأسهل"
        className="welcome-screen__image absolute inset-0 h-full w-full object-cover object-center"
        fetchPriority="high"
      />
      <div className="welcome-screen__footer absolute inset-x-0 bottom-0 flex flex-col items-center px-7 pb-8 pt-20 text-center">
        <p className="mb-4 text-base font-extrabold text-[#401398] drop-shadow-[0_1px_8px_rgba(255,255,255,0.9)]">
          أهلاً بك في فزعة
        </p>
        <button
          type="button"
          onClick={handleStart}
          className="welcome-screen__button flex min-h-14 w-full max-w-[330px] items-center justify-center gap-2 rounded-full bg-gradient-to-l from-[#6125b4] to-[#42128f] px-8 py-3.5 text-lg font-extrabold text-white shadow-[0_12px_28px_rgba(65,18,143,0.35)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_34px_rgba(65,18,143,0.42)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#42128f] active:scale-[0.98] motion-reduce:animate-none motion-reduce:transition-none"
        >
          ابدأ
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
    </main>
  );
}
