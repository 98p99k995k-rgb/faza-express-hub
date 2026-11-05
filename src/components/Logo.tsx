import brandLogo from "@/assets/fazaa-delivery-logo.png";
import appIcon from "@/assets/fazaa-app-icon.png";
import { useTranslation } from "@/lib/useTranslation";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const { t } = useTranslation();
  if (size === "lg") {
    return (
      <img
        src={brandLogo}
        alt={t("فزعة — مع بعض.. دايماً أقوى")}
        className="h-auto w-full max-w-[290px] object-contain"
      />
    );
  }

  const iconSize = size === "sm" ? "h-11 w-11" : "h-14 w-14";
  const titleSize = size === "sm" ? "text-lg" : "text-xl";

  return (
    <div className="flex items-center gap-2.5">
      <img
        src={appIcon}
        alt=""
        className={`${iconSize} rounded-xl object-cover shadow-card-soft`}
      />
      <div className="leading-tight">
        <div className={`${titleSize} font-black text-brand-gradient`}>فزعة</div>
        <div className="text-[9px] font-bold text-muted-foreground">{t("توصيل جدة بسرعة")}</div>
      </div>
    </div>
  );
}
