import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "inverse";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm disabled:bg-brand-300",
  secondary: "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 shadow-sm",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  /** 진한 배경 위에 놓는 흰색 버튼 */
  inverse: "bg-white text-brand-800 hover:bg-brand-50 shadow-sm",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-md",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-5 text-[15px] gap-2 rounded-lg",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  className?: string;
}

export function buttonClass({ variant = "primary", size = "md", className }: BaseProps = {}) {
  return cn(
    "inline-flex items-center justify-center font-semibold whitespace-nowrap transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
    "disabled:cursor-not-allowed disabled:opacity-70",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({ variant, size, icon, className, children, ...props }: BaseProps & ComponentProps<"button">) {
  return (
    <button className={buttonClass({ variant, size, className })} {...props}>
      {icon}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  icon,
  className,
  children,
  ...props
}: BaseProps & ComponentProps<typeof Link>) {
  return (
    <Link className={buttonClass({ variant, size, className })} {...props}>
      {icon}
      {children}
    </Link>
  );
}
