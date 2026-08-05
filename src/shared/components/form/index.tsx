import type {
  ReactNode,
  SelectHTMLAttributes,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

/** Shared form primitives built on design tokens (mobile first, 44px touch targets). */

export const controlClass = cn(
  "min-h-11 w-full rounded-md border border-border bg-surface px-md text-body-sm text-text-primary",
  "placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

export const buttonClass = cn(
  "inline-flex min-h-11 items-center justify-center gap-xs rounded-md bg-primary px-md text-body-sm",
  "font-medium text-primary-foreground transition-colors motion-fast hover:bg-primary/90",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
);

export const ghostButtonClass = cn(
  "inline-flex min-h-11 items-center justify-center gap-xs rounded-md border border-border bg-surface px-sm",
  "text-body-sm text-text-primary transition-colors motion-fast hover:bg-muted",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
);

export interface FieldProps {
  readonly label: string;
  readonly htmlFor: string;
  readonly error?: string | undefined;
  readonly hint?: string;
  readonly children: ReactNode;
}

export function Field({ label, htmlFor, error, hint, children }: FieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-xs">
      <label htmlFor={htmlFor} className="text-body-sm text-text-primary">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-caption text-text-secondary">{hint}</p>}
      {error && (
        <p role="alert" className="text-caption text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(controlClass, props.className)} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(controlClass, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(controlClass, "min-h-24 py-sm", props.className)} />;
}
