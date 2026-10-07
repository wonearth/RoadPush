"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export const inputClass = cn(
  "block w-full rounded-xl border-0 bg-slate-100 px-4 py-3 text-[15px] text-slate-900",
  "placeholder:text-slate-500",
  "focus:bg-white focus:ring-2 focus:ring-inset focus:ring-brand-500 focus:outline-none",
  "aria-[invalid=true]:ring-red-400",
);

interface FieldProps extends ComponentProps<"input"> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

export function TextField({ label, error, hint, className, id, ...props }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input id={inputId} aria-invalid={Boolean(error)} className={inputClass} {...props} />
      <FieldMessage error={error} hint={hint} />
    </div>
  );
}

export function PasswordField({ label, error, hint, className, id, ...props }: FieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [visible, setVisible] = useState(false);
  return (
    <div className={className}>
      <label htmlFor={inputId} className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          className={cn(inputClass, "pr-11")}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600"
          aria-label={visible ? "비밀번호 숨기기" : "비밀번호 표시"}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <FieldMessage error={error} hint={hint} />
    </div>
  );
}

function FieldMessage({ error, hint }: { error?: string; hint?: ReactNode }) {
  if (error) return <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>;
  if (hint) return <p className="mt-1.5 text-xs text-slate-500">{hint}</p>;
  return null;
}
