import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "inverse";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:bg-brand-300",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger: "bg-[#d92d20] text-white hover:bg-[#b42318]",
  /** 진한 배경 위에 놓는 흰색 버튼 */
  inverse: "bg-white text-brand-700 hover:bg-brand-50",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5 rounded-lg",
  md: "h-11 px-5 text-[15px] gap-2 rounded-xl",
  lg: "h-13 px-6 text-base gap-2 rounded-xl",
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
