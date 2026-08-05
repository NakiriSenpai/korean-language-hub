import { Link } from "@tanstack/react-router";
import { LockKeyhole, ShieldX } from "lucide-react";

import { cn } from "@/lib/utils";

const actionClass = cn(
  "inline-flex min-h-11 items-center justify-center rounded-md px-lg text-body-sm",
  "transition-all motion-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
);

interface AccessPageProps {
  readonly code: string;
  readonly title: string;
  readonly description: string;
  readonly icon: typeof LockKeyhole;
  readonly action: { readonly to: string; readonly label: string };
}

function AccessPage({ code, title, description, icon: Icon, action }: AccessPageProps) {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-background px-md">
      <div className="flex max-w-[46ch] flex-col items-center gap-md text-center">
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-full bg-warning/10 text-warning"
        >
          <Icon className="size-7" />
        </span>
        <p className="text-caption uppercase tracking-widest text-text-secondary">{code}</p>
        <h1 className="text-h2 text-text-primary">{title}</h1>
        <p className="text-body-sm text-text-secondary">{description}</p>
        <Link to={action.to} className={cn(actionClass, "bg-primary text-primary-foreground")}>
          {action.label}
        </Link>
      </div>
    </div>
  );
}

/** 401 — user is not signed in (or the session expired). */
export function UnauthorizedPage() {
  return (
    <AccessPage
      code="Error 401"
      icon={LockKeyhole}
      title="Kamu belum masuk"
      description="Sesi tidak ditemukan atau sudah berakhir. Silakan masuk kembali untuk melanjutkan."
      action={{ to: "/auth", label: "Masuk" }}
    />
  );
}

/** 403 — signed in, but the membership/role does not grant access. */
export function ForbiddenPage() {
  return (
    <AccessPage
      code="Error 403"
      icon={ShieldX}
      title="Akses ditolak"
      description="Peran keanggotaan kamu tidak memiliki izin untuk membuka halaman ini."
      action={{ to: "/", label: "Kembali ke Dashboard" }}
    />
  );
}
