"use client";
import { useI18n } from "@/i18n/I18nProvider";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
export function Toast({ message }: { message: string }) {
  const { t } = useI18n();
  const [phase, setPhase] = useState<"shown" | "leaving" | "gone">("shown");
  useEffect(() => {
    const timer = setTimeout(() => setPhase("leaving"), 5000);
    return () => clearTimeout(timer);
  }, []);
  if (phase === "gone") return null;
  return (
    <div
      className={"feedback-toast" + (phase === "leaving" ? " leaving" : "")}
      role="status"
      onAnimationEnd={(e) => {
        if (e.animationName === "toast-out") setPhase("gone");
      }}
    >
      <span className="toast-check">
        <Icon name="check" size={14} />
      </span>
      <p>{message}</p>
      <button aria-label={t("关闭提示")} onClick={() => setPhase("leaving")}>
        <Icon name="close" size={14} />
      </button>
      <span className="toast-timer" aria-hidden="true" />
    </div>
  );
}
