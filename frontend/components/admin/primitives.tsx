"use client";

import Link from "next/link";
import { ReactNode, SVGProps, useEffect } from "react";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function MaterialIcon({
  children,
  className,
  filled = false,
}: {
  children: string;
  className?: string;
  filled?: boolean;
}) {
  const commonProps: SVGProps<SVGSVGElement> = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: cn("h-[1em] w-[1em] shrink-0", className),
    "aria-hidden": true,
  };

  const icon = (() => {
    switch (children) {
      case "search":
        return (
          <svg {...commonProps}>
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
        );
      case "dashboard":
        return (
          <svg {...commonProps}>
            <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
            <rect x="13.5" y="3.5" width="7" height="5" rx="1.5" />
            <rect x="13.5" y="11.5" width="7" height="9" rx="1.5" />
            <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          </svg>
        );
      case "group":
        return (
          <svg {...commonProps}>
            <circle cx="9" cy="9" r="2.5" />
            <circle cx="16.5" cy="10" r="2" />
            <path d="M4.5 18c.8-2.3 2.8-3.5 4.5-3.5S12.7 15.7 13.5 18" />
            <path d="M14.2 17.3c.5-1.7 1.9-2.8 3.6-2.8 1.3 0 2.4.5 3.2 1.8" />
          </svg>
        );
      case "code":
        return (
          <svg {...commonProps}>
            <path d="m9 8-4 4 4 4" />
            <path d="m15 8 4 4-4 4" />
            <path d="m13 5-2 14" />
          </svg>
        );
      case "assignment":
      case "assignment_turned_in":
        return (
          <svg {...commonProps}>
            <rect x="6" y="4.5" width="12" height="16" rx="2" />
            <path d="M9 4.5h6v3H9z" />
            {children === "assignment_turned_in" ? <path d="m9.2 13 2 2 3.6-4" /> : <path d="M9 10h6M9 14h6" />}
          </svg>
        );
      case "fact_check":
        return (
          <svg {...commonProps}>
            <rect x="5" y="4.5" width="14" height="16" rx="2" />
            <path d="m8.5 10 1.5 1.5 2.5-3" />
            <path d="M13.5 9H16M13.5 14H16" />
            <path d="m8.5 15 1.5 1.5 2.5-3" />
          </svg>
        );
      case "chat":
        return (
          <svg {...commonProps}>
            <path d="M5 6.5h14v9H9l-4 3z" />
          </svg>
        );
      case "analytics":
        return (
          <svg {...commonProps}>
            <path d="M5 18V8" />
            <path d="M10 18V11" />
            <path d="M15 18V6" />
            <path d="M20 18V13" />
          </svg>
        );
      case "category":
        return (
          <svg {...commonProps}>
            <path d="M4 7V4h3l10 10-3 3z" />
            <circle cx="7.5" cy="7.5" r="1" />
            <path d="m14 5 5 5" />
          </svg>
        );
      case "settings":
        return (
          <svg {...commonProps}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19 12a7 7 0 0 0-.1-1l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-1.7-1L14.5 3h-5L9 5a7.5 7.5 0 0 0-1.7 1l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.5 7.5 0 0 0 1.7 1l.5 2h5l.5-2a7.5 7.5 0 0 0 1.7-1l2.4 1 2-3.4-2-1.6c.1-.3.1-.7.1-1Z" />
          </svg>
        );
      case "notifications":
        return (
          <svg {...commonProps}>
            <path d="M12 4.5a4 4 0 0 0-4 4V11c0 1.2-.4 2.4-1.2 3.3L6 15.5h12l-.8-1.2A5.4 5.4 0 0 1 16 11V8.5a4 4 0 0 0-4-4Z" />
            <path d="M10 18a2 2 0 0 0 4 0" />
          </svg>
        );
      case "logout":
        return (
          <svg {...commonProps}>
            <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" />
            <path d="m14 8 4 4-4 4" />
            <path d="M18 12H9" />
          </svg>
        );
      case "download":
        return (
          <svg {...commonProps}>
            <path d="M12 4v10" />
            <path d="m8.5 10.5 3.5 3.5 3.5-3.5" />
            <path d="M5 19h14" />
          </svg>
        );
      case "add":
        return (
          <svg {...commonProps}>
            <path d="M12 5v14M5 12h14" />
          </svg>
        );
      case "play_circle":
        return (
          <svg {...commonProps}>
            <circle cx="12" cy="12" r="8.5" />
            <path d="m10 8.8 5 3.2-5 3.2z" fill={filled ? "currentColor" : "none"} />
          </svg>
        );
      case "star":
        return (
          <svg {...commonProps}>
            <path d="m12 4 2.3 4.7 5.2.8-3.8 3.7.9 5.3L12 16l-4.6 2.5.9-5.3L4.5 9.5l5.2-.8z" fill={filled ? "currentColor" : "none"} />
          </svg>
        );
      case "person_add":
        return (
          <svg {...commonProps}>
            <circle cx="10" cy="8" r="3" />
            <path d="M4.5 18c1.1-2.5 3.3-4 5.5-4s4.4 1.5 5.5 4" />
            <path d="M18 8v6M15 11h6" />
          </svg>
        );
      case "pending_actions":
        return (
          <svg {...commonProps}>
            <rect x="5" y="4.5" width="14" height="16" rx="2" />
            <path d="M9 9h6M9 13h4" />
            <circle cx="15.5" cy="15.5" r="2.5" />
          </svg>
        );
      case "rocket_launch":
        return (
          <svg {...commonProps}>
            <path d="M14 5c3 0 5 2 5 5-3 2-6 3-9 3-1.8 0-3.5-.3-5-.9.2-3.1 2.7-7.1 9-7.1Z" />
            <path d="m10 13-3 3" />
            <path d="M6 14 4 20l6-2" />
          </svg>
        );
      case "check_circle":
        return (
          <svg {...commonProps}>
            <circle cx="12" cy="12" r="8.5" />
            <path d="m8.5 12.5 2.3 2.3 4.7-5" />
          </svg>
        );
      case "trending_up":
        return (
          <svg {...commonProps}>
            <path d="m4 15 5-5 4 4 7-7" />
            <path d="M15 7h5v5" />
          </svg>
        );
      case "filter_list":
        return (
          <svg {...commonProps}>
            <path d="M4 7h16M7 12h10M10 17h4" />
          </svg>
        );
      case "visibility":
        return (
          <svg {...commonProps}>
            <path d="M2.5 12s3.5-5.5 9.5-5.5S21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        );
      case "menu":
        return (
          <svg {...commonProps}>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        );
      case "payments":
        return (
          <svg {...commonProps}>
            <rect x="4" y="6" width="16" height="12" rx="2" />
            <path d="M4 10h16" />
            <path d="M8 14h4" />
          </svg>
        );
      case "cloud_off":
        return (
          <svg {...commonProps}>
            <path d="M8 18a4 4 0 0 1-.2-8 5.5 5.5 0 0 1 10.5 1.7A3.5 3.5 0 0 1 17 18Z" />
            <path d="m4 4 16 16" />
          </svg>
        );
      case "chevron_left":
        return (
          <svg {...commonProps}>
            <path d="m14.5 6-6 6 6 6" />
          </svg>
        );
      case "chevron_right":
        return (
          <svg {...commonProps}>
            <path d="m9.5 6 6 6-6 6" />
          </svg>
        );
      case "calendar_today":
        return (
          <svg {...commonProps}>
            <rect x="4.5" y="6" width="15" height="13.5" rx="2" />
            <path d="M8 4.5v3M16 4.5v3M4.5 9.5h15" />
          </svg>
        );
      case "terminal":
        return (
          <svg {...commonProps}>
            <path d="m6 8 3 3-3 3" />
            <path d="M11 15h7" />
          </svg>
        );
      case "check":
        return (
          <svg {...commonProps}>
            <path d="m5.5 12.5 4 4 9-9" />
          </svg>
        );
      case "lock":
        return (
          <svg {...commonProps}>
            <rect x="6" y="11" width="12" height="9" rx="2" />
            <path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3" />
          </svg>
        );
      case "person":
        return (
          <svg {...commonProps}>
            <circle cx="12" cy="8" r="3" />
            <path d="M5 18c1-3 3.8-4.5 7-4.5S18 15 19 18" />
          </svg>
        );
      case "engineering":
        return (
          <svg {...commonProps}>
            <path d="M8 7.5 12 4l4 3.5" />
            <path d="M7 8h10v3H7z" />
            <path d="M9 11v4M15 11v4" />
            <path d="M6 18h12" />
          </svg>
        );
      case "edit_square":
        return (
          <svg {...commonProps}>
            <path d="M4.5 19.5h4l9-9-4-4-9 9z" />
            <path d="m12.5 6.5 4 4" />
          </svg>
        );
      case "block":
        return (
          <svg {...commonProps}>
            <circle cx="12" cy="12" r="8.5" />
            <path d="m7 17 10-10" />
          </svg>
        );
      case "bolt":
        return (
          <svg {...commonProps}>
            <path d="M13 3 6 13h4l-1 8 7-10h-4z" fill={filled ? "currentColor" : "none"} />
          </svg>
        );
      case "delete":
        return (
          <svg {...commonProps}>
            <path d="M5 7h14" />
            <path d="M9 7V5h6v2" />
            <path d="M8 7l1 12h6l1-12" />
          </svg>
        );
      case "close":
        return (
          <svg {...commonProps}>
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        );
      case "warning":
        return (
          <svg {...commonProps}>
            <path d="M12 4 3.5 19h17z" />
            <path d="M12 9v4" />
            <circle cx="12" cy="16" r=".7" fill="currentColor" stroke="none" />
          </svg>
        );
      case "play_arrow":
        return (
          <svg {...commonProps}>
            <path d="M6 4.5v15l13-7.5z" fill={filled ? "currentColor" : "none"} />
          </svg>
        );
      case "upload":
        return (
          <svg {...commonProps}>
            <path d="M12 4v10" />
            <path d="m8.5 7.5 3.5-3.5 3.5 3.5" />
            <path d="M5 19h14" />
          </svg>
        );
      case "deployed_code":
      default:
        return (
          <svg {...commonProps}>
            <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
            <path d="m9 10-2 2 2 2" />
            <path d="m15 10 2 2-2 2" />
            <path d="m13 8-2 8" />
          </svg>
        );
    }
  })();

  return (
    <span className="inline-flex items-center justify-center leading-none">
      {icon}
    </span>
  );
}

export function SurfaceCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-outline-variant bg-surface-container-lowest shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ActionButton({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles = {
    primary:
      "bg-primary text-on-primary hover:opacity-90 shadow-sm",
    secondary:
      "border border-outline-variant bg-white text-on-surface hover:bg-surface-container-low",
    danger:
      "border border-rose-200 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20",
    ghost:
      "bg-transparent text-primary hover:bg-primary-container/10",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[14px] font-semibold transition-all",
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toUpperCase();
  const className =
    normalized === "ACTIVE" || normalized === "PUBLISHED" || normalized === "VISIBLE"
      ? "bg-emerald-500/10 text-emerald-700"
      : normalized === "PENDING_REVIEW" || normalized === "FLAGGED" || normalized === "SUSPENDED"
        ? "bg-amber-500/10 text-amber-700"
        : normalized === "DISABLED" || normalized === "REJECTED" || normalized === "HIDDEN"
          ? "bg-rose-500/10 text-rose-700"
          : "bg-secondary-container text-on-secondary-container";

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold", className)}>
      {normalized === "ACTIVE" || normalized === "PUBLISHED" || normalized === "VISIBLE" ? (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      ) : null}
      {value.replaceAll("_", " ")}
    </span>
  );
}

export function SearchPill({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <MaterialIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
        search
      </MaterialIcon>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-outline-variant bg-surface-container-low py-2 pl-10 pr-4 text-[14px] text-on-surface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  chip,
  iconTone = "primary",
  onClick,
}: {
  label: string;
  value: string | number;
  icon: string;
  chip: string;
  iconTone?: "primary" | "secondary" | "tertiary" | "danger" | "warning";
  onClick?: () => void;
}) {
  const iconStyles = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    tertiary: "bg-tertiary/10 text-tertiary",
    danger: "bg-error/10 text-error",
    warning: "bg-amber-100 text-amber-700",
  };

  return (
    <SurfaceCard
      className={cn(
        "p-5 transition-all hover:border-primary",
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : "",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={!onClick}
        className={cn(
          "w-full text-left",
          onClick ? "cursor-pointer" : "cursor-default",
        )}
      >
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", iconStyles[iconTone])}>
          <MaterialIcon className="text-[20px]" filled>
            {icon}
          </MaterialIcon>
        </div>
        <span className="rounded-full px-2 py-1 text-[10px] font-bold text-on-surface-variant">
          {chip}
        </span>
      </div>
      <p className="text-[12px] uppercase tracking-[0.08em] text-on-surface-variant">{label}</p>
      <p className="mt-3 text-[34px] font-semibold leading-none text-on-surface">{value}</p>
      </button>
    </SurfaceCard>
  );
}

export function TableWrapper({
  columns,
  children,
  className,
  scrollable = false,
}: {
  columns: string[];
  children: ReactNode;
  className?: string;
  scrollable?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-x-auto",
        scrollable && "max-h-[min(360px,50vh)] overflow-y-auto",
        className,
      )}
    >
      <table className="w-full border-collapse text-left">
        <thead className={scrollable ? "sticky top-0 z-10" : undefined}>
          <tr className="border-b border-outline-variant bg-surface-container-low">
            {columns.map((column) => (
              <th
                key={column}
                className="bg-surface-container-low px-6 py-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/30">{children}</tbody>
      </table>
    </div>
  );
}

export function TableRow({ children }: { children: ReactNode }) {
  return <tr className="transition-colors hover:bg-surface-container-lowest">{children}</tr>;
}

export function TableCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={cn("px-6 py-4 align-top", className)}>{children}</td>;
}

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <SurfaceCard
      className={cn(
        "flex min-h-[320px] flex-col items-center justify-center px-8 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MaterialIcon className="text-[26px]" filled>
          deployed_code
        </MaterialIcon>
      </div>
      <h3 className="text-[24px] font-semibold text-on-surface">{title}</h3>
      <p className="mt-3 max-w-lg text-[14px] leading-6 text-on-surface-variant">{description}</p>
    </SurfaceCard>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-inverse-surface/60 px-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-outline-variant bg-surface-bright px-8 py-6">
          <h3 className="text-[18px] font-semibold text-on-surface">{title}</h3>
          <button onClick={onClose} className="text-on-surface-variant">
            <MaterialIcon>close</MaterialIcon>
          </button>
        </div>
        <div className="overflow-y-auto p-8">{children}</div>
      </div>
    </div>
  );
}

export function Drawer({
  open,
  title,
  children,
  actions,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-on-background/20 backdrop-blur-[2px]" />
      <div className="fixed right-0 top-0 z-[60] h-screen w-full max-w-[600px] overflow-y-auto border-l border-outline-variant bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <MaterialIcon className="text-primary">assignment_turned_in</MaterialIcon>
            <h3 className="text-[18px] font-semibold text-on-surface">{title}</h3>
          </div>
          <div className="flex items-center gap-3">
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
            <button onClick={onClose} className="rounded-full p-2 text-on-surface-variant transition-colors hover:bg-slate-100">
              <MaterialIcon>close</MaterialIcon>
            </button>
          </div>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </>
  );
}

export function Toast({
  message,
  tone = "success",
}: {
  message: string;
  tone?: "success" | "danger";
}) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-[80] rounded-xl border px-4 py-3 text-[14px] font-semibold shadow-lg",
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700",
      )}
    >
      {message}
    </div>
  );
}

export function SidebarLink({
  href,
  icon,
  label,
  active,
  className,
}: {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "mx-2 my-1 flex items-center gap-3 rounded-xl px-6 py-3 text-[14px] transition-all",
        active
          ? "bg-primary-container text-on-primary-container"
          : "text-secondary-fixed-dim hover:bg-on-secondary-fixed-variant/50 hover:text-white",
        className,
      )}
    >
      <MaterialIcon className="text-[20px]" filled={active}>
        {icon}
      </MaterialIcon>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export const Card = SurfaceCard;
export const Button = ActionButton;
export const SearchInput = SearchPill;
export const Table = TableWrapper;

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex items-end justify-between">
      <div>
        <h1 className="text-[24px] font-semibold text-on-surface">{title}</h1>
        <p className="text-[16px] text-on-surface-variant">{description}</p>
      </div>
      {actions ? <div className="flex gap-3">{actions}</div> : null}
    </div>
  );
}
