import { useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn } from "lucide-react";

import { cn } from "@/lib/utils";
import { toUserMessage } from "@/shared/platform";
import { useAuth } from "@/modules/identity/hooks/useAuth";

const fieldClass = cn(
  "min-h-11 w-full rounded-md border border-border bg-surface px-md text-body-sm text-text-primary",
  "placeholder:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

export interface SignInFormProps {
  /** Where to go after a successful sign in. */
  readonly redirectTo?: string;
}

export function SignInForm({ redirectTo = "/" }: SignInFormProps) {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn({ email, password });
      await navigate({ to: redirectTo });
    } catch (cause) {
      setError(toUserMessage(cause));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-md" noValidate>
      <div className="flex flex-col gap-xs">
        <label htmlFor="email" className="text-body-sm text-text-primary">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClass}
          placeholder="nama@lembaga.id"
        />
      </div>

      <div className="flex flex-col gap-xs">
        <label htmlFor="password" className="text-body-sm text-text-primary">
          Kata sandi
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClass}
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p role="alert" className="text-body-sm text-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-sm rounded-md bg-primary px-lg",
          "text-body-sm text-primary-foreground transition-all motion-fast",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:opacity-60",
        )}
      >
        {submitting ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <LogIn className="size-4" aria-hidden="true" />
        )}
        {submitting ? "Memproses…" : "Masuk"}
      </button>
    </form>
  );
}
