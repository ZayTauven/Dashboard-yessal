import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock } from "lucide-react";
import {
  GUIDE_CHAPTERS,
  GUIDE_SECTIONS,
  ROLE_LABELS,
  chapterBySlug,
  neighbours,
} from "@/lib/guide/manifest";
import { CHAPTER_BODIES } from "@/components/guide/chapters";
import { GuideIcon } from "@/components/guide/GuideIcon";
import { GuideToc } from "@/components/guide/GuideToc";
import { ChapterFooter } from "@/components/guide/ChapterFooter";
import { Pill } from "@/components/guide/primitives";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Un chapitre
 * ═══════════════════════════════════════════════════════════════════════════
 * L'en-tête, le corps et le pied sont assemblés ici pour les treize chapitres :
 * le contenu seul change, et il vit dans `components/guide/chapters/`.
 *
 * Les chapitres sont des composants SERVEUR — du texte, des images, aucune
 * interaction — donc rien n'est envoyé au navigateur pour les afficher. Les
 * trois morceaux qui ont besoin du client (l'infobulle d'un terme, l'accordéon
 * des questions, la case « lu ») portent leur propre directive.
 */

export function generateStaticParams() {
  return GUIDE_CHAPTERS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const chapter = chapterBySlug(slug);
  if (!chapter) return { title: "Chapitre introuvable" };
  return { title: chapter.title, description: chapter.lead };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const chapter = chapterBySlug(slug);
  const Body = CHAPTER_BODIES[slug];

  /* Un slug inconnu — ou déclaré au sommaire sans composant — est un vrai 404 :
     la page n'existe pas, et rien ne sert de la maquiller. */
  if (!chapter || !Body) notFound();

  const section = GUIDE_SECTIONS.find((s) => s.id === chapter.section);
  const { prev, next } = neighbours(slug);

  return (
    <>
      <main className="yg-main">
        <article>
          <header className="yg-chead">
            <div>
              <p className="yg-chead__eyebrow">
                <GuideIcon name={chapter.icon} size={14} />
                {section?.label}
              </p>
              <h1 className="yg-chead__title">{chapter.title}</h1>
              <p className="yg-chead__lead">{chapter.lead}</p>
              <div className="yg-chead__meta">
                <Pill>
                  <Clock size={12} aria-hidden="true" />
                  {chapter.minutes} min de lecture
                </Pill>
                {chapter.roles.length === 0 ? (
                  <Pill tone="accent">Tout le monde</Pill>
                ) : (
                  chapter.roles.map((r) => (
                    <Pill key={r} tone="accent">
                      {ROLE_LABELS[r]}
                    </Pill>
                  ))
                )}
              </div>
            </div>

            {chapter.picto && (
              <div className="yg-chead__art" aria-hidden="true">
                <Image
                  className="yg-picto"
                  src={`/guide-assets/pictos/${chapter.picto}`}
                  alt=""
                  width={240}
                  height={240}
                />
              </div>
            )}
          </header>

          <div className="yg-prose">
            <Body />
          </div>

          <ChapterFooter
            slug={chapter.slug}
            prev={prev ? { slug: prev.slug, title: prev.title } : null}
            next={next ? { slug: next.slug, title: next.title } : null}
          />
        </article>
      </main>

      <GuideToc />
    </>
  );
}
