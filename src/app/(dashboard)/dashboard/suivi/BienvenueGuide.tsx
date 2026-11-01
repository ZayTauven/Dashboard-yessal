/*
 * L'accueil de Sangue Bi, avant les chiffres (demande du 2026-11-01).
 *
 * Serigne Béthio Thioune, figure du Kourel, dans une arche dorée — la forme
 * d'un mihrab. Derrière, le Magal de Touba vu du ciel, fondu dans le violet de
 * la marque, et un semis discret d'étoiles à huit branches. Le bandeau reste
 * sombre dans les deux thèmes : la photo est détourée sur un fond noir.
 *
 * Composant serveur : la date (grégorienne et hégirienne) se calcule sur le
 * jour de Dakar, côté serveur, sans risque d'écart d'hydratation.
 */
import Image from "next/image";

const OR = "#E8C46A";

function dateDuJour() {
  const maintenant = new Date();
  const jour = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Dakar",
  }).format(maintenant);
  let hegire: string | null = null;
  try {
    hegire = new Intl.DateTimeFormat("fr-FR-u-ca-islamic-umalqura", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Africa/Dakar",
    }).format(maintenant);
  } catch {
    /* Calendrier hégirien absent de ce moteur : la date grégorienne suffit. */
  }
  return { jour: jour.charAt(0).toUpperCase() + jour.slice(1), hegire };
}

/* L'étoile à huit branches (khatam), répétée en motif très discret. */
function MotifEtoiles({ id }: { id: string }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
          <g transform="translate(28 28)" fill="none" stroke={OR} strokeWidth="0.8" strokeOpacity="0.13">
            <rect x="-9" y="-9" width="18" height="18" />
            <rect x="-9" y="-9" width="18" height="18" transform="rotate(45)" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function BienvenueGuide({ prenom }: { prenom: string }) {
  const { jour, hegire } = dateDuJour();

  return (
    <section
      aria-label="Bienvenue"
      className="relative isolate overflow-hidden rounded-2xl"
      style={{ background: "linear-gradient(120deg, #1B1033 0%, #2E1A5E 48%, #44238A 100%)" }}
    >
      {/* Le Magal de Touba, teinté dans le violet et fondu vers le portrait. */}
      <Image
        src="/assets/kourel/magal-touba-vue-aerienne.jpg"
        alt=""
        fill
        sizes="(min-width: 1024px) 70vw, 100vw"
        className="-z-10 object-cover opacity-30 mix-blend-luminosity"
        style={{ maskImage: "linear-gradient(90deg, #000 0%, rgba(0,0,0,0.55) 45%, transparent 85%)" }}
        priority
      />
      <MotifEtoiles id="bienvenue-etoiles" />
      {/* Un halo doré derrière le portrait. */}
      <div
        className="pointer-events-none absolute -right-10 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full"
        style={{ background: `radial-gradient(circle, ${OR}40 0%, transparent 65%)` }}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-3 p-4 sm:gap-8 sm:p-8">
        <div className="min-w-0 flex-1">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.22em]"
            style={{ color: OR }}
          >
            Bienvenue au Kourel
          </p>
          <h2
            className="mt-2 text-xl font-bold leading-tight text-white sm:text-4xl"
            style={{ fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}
          >
            Assalamou alaykoum{prenom ? `, ${prenom}` : ""}
          </h2>
          <p className="mt-2 max-w-xl text-sm text-white/75 sm:text-base">
            {"Les Jëfs, les Ndiguels et les annonces du Kourel vous attendent ci-dessous."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/70">
            <span>{jour}</span>
            {hegire && (
              <>
                <span aria-hidden="true" style={{ color: OR }}>
                  ✦
                </span>
                <span>{hegire}</span>
              </>
            )}
          </div>
        </div>

        <figure className="relative w-24 shrink-0 sm:w-36">
          {/* L'arche : un mihrab, bordé d'or. Le fond noir de la photo s'y
              lit comme voulu. */}
          <div
            className="relative h-32 w-24 overflow-hidden sm:h-48 sm:w-36"
            style={{
              borderRadius: "999px 999px 18px 18px",
              border: `2px solid ${OR}`,
              boxShadow: `0 0 0 5px rgba(232, 196, 106, 0.18), 0 18px 40px -12px rgba(0, 0, 0, 0.6)`,
              background: "#000",
            }}
          >
            <Image
              src="/assets/kourel/serigne-bethio-thioune.jpg"
              alt="Serigne Béthio Thioune"
              fill
              sizes="(min-width: 640px) 144px, 96px"
              className="object-cover object-top"
              priority
            />
          </div>
          <figcaption
            className="mt-2 text-center text-[9px] font-semibold uppercase leading-snug tracking-[0.12em] sm:text-[11px]"
            style={{ color: OR }}
          >
            Serigne Béthio Thioune
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
