/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Squelettes de chargement
 * ═══════════════════════════════════════════════════════════════════════════
 * Toutes les pages du tableau de bord sont des composants serveur en
 * `force-dynamic` : la navigation attend l'API avant de peindre quoi que ce
 * soit. Sur une connexion mobile sénégalaise, cela veut dire une à trois
 * secondes d'écran figé — et l'utilisateur reclique, croyant que rien ne s'est
 * passé.
 *
 * Ces squelettes se posent dans les `loading.tsx` : Next les affiche
 * instantanément pendant que la page se résout. Ils ne miment pas vaguement du
 * contenu, ils reprennent la GÉOMÉTRIE réelle de chaque famille de page, pour
 * que le basculement vers les vraies données ne fasse pas sauter la mise en
 * page.
 *
 * L'animation vient de `.ax-skeleton` (miroitement Aurora). Elle s'arrête
 * d'elle-même sous `prefers-reduced-motion`, via la règle globale de Vireo.
 */

import { cn } from "@/lib/utils";

/* ── Primitives ────────────────────────────────────────────────────────── */

export function SkeletonLine({
  className,
  width,
}: {
  className?: string;
  width?: string;
}) {
  return (
    <span
      className={cn("ax-skeleton ax-skeleton--line block", className)}
      style={width ? { width } : undefined}
      aria-hidden="true"
    />
  );
}

export function SkeletonCircle({ size = 40 }: { size?: number }) {
  return (
    <span
      className="ax-skeleton ax-skeleton--circle block"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}

export function SkeletonRect({
  height = 120,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("ax-skeleton ax-skeleton--rect block", className)}
      style={{ height }}
      aria-hidden="true"
    />
  );
}

/**
 * Enveloppe commune : annonce le chargement aux lecteurs d'écran une seule
 * fois, au lieu de laisser chaque barre grise se faire lire.
 */
function Loading({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-6", className)} aria-busy="true" role="status">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/* ── Bandeau de KPI ────────────────────────────────────────────────────── */

export function StatRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ax-card">
          <div className="ax-card__body">
            <div className="ax-skeleton-stat">
              <SkeletonCircle size={44} />
              <SkeletonLine width="55%" />
              <SkeletonLine className="h-6" width="80%" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Page de tableau de bord ───────────────────────────────────────────── */

export function DashboardSkeleton() {
  return (
    <Loading label="Chargement du tableau de bord">
      <StatRowSkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="ax-card lg:col-span-2">
          <div className="ax-card__body flex flex-col gap-4">
            <SkeletonLine width="30%" />
            <SkeletonRect height={280} />
          </div>
        </div>
        <div className="ax-card">
          <div className="ax-card__body flex flex-col gap-4">
            <SkeletonLine width="45%" />
            <SkeletonRect height={280} />
          </div>
        </div>
      </div>
    </Loading>
  );
}

/* ── Page de liste (membres, jëfs, ndiguels, événements) ───────────────── */

export function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Loading label="Chargement de la liste">
      {/* Barre de titre + actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <SkeletonLine className="h-7" width="220px" />
        <SkeletonLine className="h-9 rounded-pill" width="150px" />
      </div>

      <div className="ax-card">
        <div className="ax-card__body flex flex-col gap-1">
          {/* En-tête de table */}
          <div className="ax-skeleton-row border-b pb-3" style={{ borderColor: "var(--ax-border)" }}>
            <SkeletonLine width="26%" />
            <SkeletonLine width="18%" />
            <SkeletonLine width="18%" />
            <SkeletonLine width="14%" />
          </div>

          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="ax-skeleton-row py-3">
              <SkeletonCircle size={34} />
              <SkeletonLine width="24%" />
              <SkeletonLine width="18%" />
              <SkeletonLine width="16%" />
              <SkeletonLine width="12%" />
            </div>
          ))}
        </div>
      </div>
    </Loading>
  );
}

/* ── Page de détail (fiche membre, fiche ndiguel) ──────────────────────── */

export function DetailSkeleton() {
  return (
    <Loading label="Chargement de la fiche">
      <div className="ax-card overflow-hidden">
        {/* Bannière */}
        <SkeletonRect height={150} className="!rounded-none" />
        <div className="ax-card__body">
          <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end">
            <SkeletonCircle size={104} />
            <div className="flex flex-1 flex-col gap-2.5 sm:pb-2">
              <SkeletonLine className="h-7" width="240px" />
              <SkeletonLine width="320px" />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <SkeletonLine width="60%" />
                <SkeletonLine className="h-6" width="85%" />
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-3">
                <SkeletonLine width="40%" />
                <SkeletonLine />
                <SkeletonLine width="75%" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Loading>
  );
}

/* ── Page de formulaire ────────────────────────────────────────────────── */

export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <Loading label="Chargement du formulaire">
      <SkeletonLine className="h-7" width="260px" />
      <div className="ax-card">
        <div className="ax-card__body grid gap-5 sm:grid-cols-2">
          {Array.from({ length: fields }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <SkeletonLine width="35%" />
              <SkeletonLine className="h-10 rounded-md" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <SkeletonLine className="h-10 rounded-md" width="110px" />
        <SkeletonLine className="h-10 rounded-md" width="150px" />
      </div>
    </Loading>
  );
}

/* ── Messagerie ────────────────────────────────────────────────────────── */

export function ChatSkeleton() {
  return (
    <Loading label="Chargement de la messagerie">
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <div className="ax-card">
          <div className="ax-card__body flex flex-col gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="ax-skeleton-row">
                <SkeletonCircle size={40} />
                <div className="flex flex-1 flex-col gap-1.5">
                  <SkeletonLine width="70%" />
                  <SkeletonLine width="90%" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="ax-card">
          <div className="ax-card__body flex flex-col gap-4">
            {/* Bulles alternées : la géométrie d'une conversation. */}
            {[70, 45, 82, 38, 60].map((w, i) => (
              <div
                key={i}
                className={cn("flex", i % 2 === 1 && "justify-end")}
              >
                <span
                  className="ax-skeleton ax-skeleton--rect block"
                  style={{ width: `${w}%`, height: i % 3 === 0 ? 64 : 40 }}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Loading>
  );
}
