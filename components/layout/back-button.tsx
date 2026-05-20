"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  const hidden = useMemo(() => pathname === "/", [pathname]);
  if (hidden) return null;

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  };

  return (
    <button
      type="button"
      aria-label="Go back"
      onClick={goBack}
      className="fixed left-4 top-4 z-[60] h-10 w-10 rounded-full border bg-white/95 text-xl leading-none shadow-sm transition hover:bg-zinc-50"
    >
      ←
    </button>
  );
}
