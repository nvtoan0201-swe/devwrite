"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenLine, Languages, BookOpen, History as HistoryIcon, PenSquare } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { I18nKey } from "@/lib/i18n";

interface NavItem {
  href: string;
  label: I18nKey;
  icon: React.ReactNode;
}

const NAV: NavItem[] = [
  { href: "/", label: "nav_practice", icon: <PenSquare size={14} /> },
  { href: "/vocab", label: "nav_vocab", icon: <BookOpen size={14} /> },
  { href: "/history", label: "nav_history", icon: <HistoryIcon size={14} /> },
];

export default function Nav() {
  const { lang, toggle, t } = useLang();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header className="border-b border-[#e0e2e6] bg-white">
      <div className="max-w-[1440px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span
            className="inline-flex h-8 w-8 items-center justify-center rounded-[10px]"
            style={{ background: "#1b61c9", color: "white" }}
            aria-hidden
          >
            <PenLine size={18} />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[16px] font-medium tracking-[0.08px] text-[#181d26]">
              DevWrite
            </span>
            <span className="text-[12px] tracking-[0.07px] text-[rgba(4,14,32,0.55)]">
              {t("header_tagline")}
            </span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium tracking-[0.08px] transition-colors ${
                  active
                    ? "bg-[rgba(27,97,201,0.1)] text-[#1b61c9]"
                    : "text-[rgba(4,14,32,0.69)] hover:text-[#181d26] hover:bg-[#f8fafc]"
                }`}
              >
                <span aria-hidden>{item.icon}</span>
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e0e2e6] bg-white px-3 py-1.5 text-[12px] font-medium tracking-[0.08px] text-[#181d26] hover:border-[#1b61c9] hover:text-[#1b61c9] transition-colors"
            aria-label="Toggle language"
            title={lang === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
          >
            <Languages size={12} aria-hidden />
            {lang === "vi" ? "VI" : "EN"}
          </button>
          <span className="hidden sm:inline-flex dw-chip">{t("header_chip")}</span>
        </div>
      </div>
    </header>
  );
}
