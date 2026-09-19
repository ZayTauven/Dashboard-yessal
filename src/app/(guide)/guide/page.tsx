import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, LifeBuoy, Sparkles } from "lucide-react";
import {
  GUIDE_CHAPTERS,
  GUIDE_SECTIONS,
  chaptersOfSection,
} from "@/lib/guide/manifest";
import { LEXIQUE } from "@/lib/guide/lexique";
import { GuideIcon } from "@/components/guide/GuideIcon";
import { RolePicker } from "@/components/guide/RolePicker";
import { Faq } from "@/components/guide/Faq";
import { Card, Cards, Ornament, Pill } from "@/components/guide/primitives";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * L'accueil du guide
 * ═══════════════════════════════════════════════════════════════════════════
 * Trois entrées, dans l'ordre où l'on vient réellement chercher quelque chose :
 *
 *   1. « Je suis… » — parce qu'un collecteur et un administrateur n'ont pas
 *      les mêmes six pages à lire, et que treize chapitres découragent qui
 *      cherche une réponse précise.
 *   2. Le sommaire complet, par section.
 *   3. Les questions fréquentes — celles qui n'ont pas besoin d'un chapitre.
 *
 * Aucun chiffre n'est avancé sur cette page. La page d'accueil publique avait
 * déjà tranché en ce sens : mieux vaut une promesse assumée qu'un nombre qu'on
 * ne peut pas tenir à jour.
 */

const FAQ = [
  {
    q: "Quelqu'un de mon Daara n'arrive pas à se connecter.",
    a: (
      <>
        <p>
          Une inscription n’ouvre pas l’accès immédiatement : un
          administrateur vérifie les informations, puis active le compte. Tant
          que cette validation n’est pas faite, la connexion est refusée —
          et le message affiché ne dit pas toujours laquelle des deux raisons
          est en cause.
        </p>
        <p>
          Le chapitre{" "}
          <Link href="/guide/premiers-pas">Ouvrir son compte</Link> décrit le
          circuit complet, du formulaire à la première connexion, avec ce
          qu’il faut vérifier à chaque étape.
        </p>
      </>
    ),
  },
  {
    q: "Quelle différence entre un Jëf et un Ndiguel ?",
    a: (
      <p>
        Un <strong>Jëf</strong> est un don : un montant, un donateur, une date.
        Un <strong>Ndiguel</strong> est la campagne dans laquelle ce don se
        range : un nom, un objectif, une échéance. On fait un Jëf{" "}
        <em>dans</em> un Ndiguel — jamais l’inverse. Le{" "}
        <Link href="/guide/lexique">lexique</Link> reprend les huit mots qui
        reviennent partout.
      </p>
    ),
  },
  {
    q: "Puis-je donner au nom de quelqu'un d'autre ?",
    a: (
      <p>
        Oui. Enregistrez la personne comme <strong>tutelle</strong> — prénom,
        nom, lien de parenté — puis choisissez-la au moment de faire le Jëf. Le
        versement reste le vôtre, mais le nom du bénéficiaire y est inscrit, et
        s’il possède un compte le don apparaît dans son historique. Voir{" "}
        <Link href="/guide/tutelles">Donner au nom d’un proche</Link>.
      </p>
    ),
  },
  {
    q: "Un collecteur peut-il encaisser en dehors de son Daara ?",
    a: (
      <p>
        Oui, et c’est la règle générale de la plateforme : rien n’est
        borné au Daara. Un collecteur collecte auprès de n’importe quel
        membre, un chef de Daara peut écrire à n’importe qui, un membre
        écrit à qui accepte de le recevoir. La limite est la préférence du
        destinataire, jamais son rattachement. Voir{" "}
        <Link href="/guide/roles">Qui fait quoi</Link>.
      </p>
    ),
  },
  {
    q: "Qui peut lancer un Ndiguel ?",
    a: (
      <p>
        L’administration, et elle seule. Ni un chef de Daara, ni un
        collecteur, ni un talibé ne créent de campagne. En revanche,
        l’<strong>organisateur</strong> désigné pour mener un Ndiguel peut
        être choisi dans n’importe quel Daara.
      </p>
    ),
  },
  {
    q: "J'ai reçu un mot de passe que je n'ai pas choisi.",
    a: (
      <p>
        C’est un mot de passe provisoire : quelqu’un d’autre a
        créé le compte pour vous — un administrateur, un collecteur sur le
        terrain, ou un import de liste. D’autres personnes le connaissent
        donc. La plateforme vous le rappellera à chaque écran tant que vous ne
        l’aurez pas remplacé. Changez-le dès la première connexion.
      </p>
    ),
  },
  {
    q: "Mon don n'apparaît pas comme confirmé.",
    a: (
      <p>
        Un versement remis en espèces à un collecteur est d’abord{" "}
        <em>en attente</em> : il attend la validation d’un administrateur.
        Un paiement en ligne réussi, lui, se confirme tout seul. Un virement
        bancaire attend que sa référence soit rapprochée. Les trois cas sont
        décrits dans <Link href="/guide/faire-un-jef">Faire un Jëf</Link>.
      </p>
    ),
  },
  {
    q: "Ce guide remplace-t-il la parole de mon Daara ?",
    a: (
      <p>
        Non. Il décrit un outil : des écrans, des boutons, des statuts. Tout ce
        qui relève de l’organisation de la communauté — qui donne quoi, à
        quelle occasion, sous quelle consigne — se décide ailleurs, et ce guide
        ne s’en mêle pas.
      </p>
    ),
  },
];

export default function GuideHome() {
  const featured = LEXIQUE.slice(0, 4);

  return (
    <main className="yg-main">
      {/* ── Bandeau ─────────────────────────────────────────────────────── */}
      <section className="yg-hero">
        <div className="yg-hero__media">
          <Image
            src="/guide-assets/decor/hero.jpg"
            alt=""
            fill
            priority
            sizes="(min-width: 992px) 60rem, 100vw"
          />
        </div>
        <div className="yg-hero__veil" />
        <Image
          className="yg-hero__ornament"
          src="/guide-assets/decor/arabesque.png"
          alt=""
          width={700}
          height={700}
          aria-hidden="true"
        />

        <div className="yg-hero__body">
          <span className="yg-hero__eyebrow">Guide de prise en main</span>
          <h1 className="yg-hero__title">
            Yessal Guide
            <em>La plateforme, expliquée simplement.</em>
          </h1>
          <p className="yg-hero__lead">
            Comment ouvrir son compte, faire un Jëf, suivre un Ndiguel, tenir
            son Daara. Treize chapitres courts, des captures de vrais écrans, et
            le vocabulaire de la maison — celui qu’on n’ose pas
            toujours demander.
          </p>
          <div className="yg-hero__actions">
            <Link href="/guide/bienvenue" className="yg-hero__btn yg-hero__btn--solid">
              Commencer par le début
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link href="/guide/lexique" className="yg-hero__btn yg-hero__btn--ghost">
              <BookOpen size={16} aria-hidden="true" />
              Le lexique
            </Link>
          </div>
        </div>
      </section>

      <div className="yg-prose mt-12 max-w-none">
        {/* ── Par où commencer ──────────────────────────────────────────── */}
        <h2 id="par-ou-commencer">Par où commencer ?</h2>
        <p className="max-w-(--yg-read)">
          Choisissez votre profil : le guide ne vous montrera que les chapitres
          qui vous concernent, et gardera le fil de ce que vous avez déjà lu.
          Rien n’est envoyé nulle part — ce choix reste sur cet appareil.
        </p>
        <RolePicker />

        <Ornament />

        {/* ── Le sommaire ───────────────────────────────────────────────── */}
        <h2 id="sommaire">Le sommaire complet</h2>
        <p className="max-w-(--yg-read)">
          Quatre sections, treize chapitres. On peut les lire dans l’ordre,
          ou n’ouvrir que celui qui répond à la question du jour.
        </p>

        {GUIDE_SECTIONS.map((section) => (
          <section key={section.id} className="mt-10">
            <div className="mb-1 flex flex-wrap items-baseline gap-3">
              <h3 className="m-0">{section.label}</h3>
              <span className="text-sm text-(--ax-text-subtle)">
                {section.blurb}
              </span>
            </div>
            <Cards cols={3}>
              {chaptersOfSection(section.id).map((chapter) => (
                <Card
                  key={chapter.slug}
                  href={`/guide/${chapter.slug}`}
                  title={chapter.title}
                  num={`${chapter.minutes} min`}
                  icon={<GuideIcon name={chapter.icon} size={18} />}
                >
                  {chapter.lead}
                </Card>
              ))}
            </Cards>
          </section>
        ))}

        <Ornament />

        {/* ── Le lexique ────────────────────────────────────────────────── */}
        <h2 id="lexique">Les mots qui reviennent</h2>
        <p className="max-w-(--yg-read)">
          Quatre d’entre eux suffisent à lire n’importe quel écran.
          Les six autres attendent dans{" "}
          <Link href="/guide/lexique">le lexique</Link>.
        </p>
        <div className="yg-lex">
          {featured.map((term) => (
            <Link
              key={term.id}
              href={`/guide/lexique#${term.id}`}
              className="yg-lex__item no-underline"
            >
              <span className="yg-lex__art">
                {term.picto ? (
                  <Image
                    className="yg-picto"
                    src={`/guide-assets/pictos/${term.picto}`}
                    alt=""
                    width={120}
                    height={120}
                  />
                ) : (
                  <Sparkles size={20} className="text-(--ax-accent)" aria-hidden="true" />
                )}
              </span>
              <span>
                <span className="yg-lex__word">{term.word}</span>
                <span className="yg-lex__def">{term.short}</span>
              </span>
            </Link>
          ))}
        </div>

        {/* ── La communauté ─────────────────────────────────────────────── */}
        <section className="mt-14 grid gap-6 rounded-(--ax-radius-xl) border border-(--ax-border) bg-(--ax-surface) p-6 md:grid-cols-[16rem_minmax(0,1fr)] md:items-center md:p-8">
          <div className="relative aspect-4/5 overflow-hidden rounded-(--ax-radius-lg)">
            <Image
              src="/guide-assets/photos/portrait.jpg"
              alt="Photographie d'une cérémonie de la communauté"
              fill
              sizes="16rem"
              className="object-cover"
            />
          </div>
          <div>
            <p className="yg-pill yg-pill--gold mb-3">Ce que ce guide n’est pas</p>
            <h3 className="mt-0">Un outil, pas une parole</h3>
            <p className="text-(--ax-text-muted)">
              Yessal Gui enregistre des dons, tient des listes et compte des
              montants. Ce guide explique ces gestes-là : où cliquer, ce que
              signifie un statut, qui a le droit de faire quoi.
            </p>
            <p className="text-(--ax-text-muted)">
              Ce qui relève de la communauté elle-même — les consignes, les
              occasions, les usages — se décide ailleurs, et le guide s’y
              tient à sa place.
            </p>
          </div>
        </section>

        {/* ── Questions fréquentes ──────────────────────────────────────── */}
        <h2 id="questions" className="mt-14">
          Questions fréquentes
        </h2>
        <p className="max-w-(--yg-read)">
          Les huit questions qui reviennent le plus souvent, et qui
          n’avaient pas besoin d’un chapitre entier.
        </p>
        <Faq entries={FAQ} />

        {/* ── Aide ─────────────────────────────────────────────────────── */}
        <div className="yg-callout mt-10">
          <span className="yg-callout__icon">
            <LifeBuoy size={16} aria-hidden="true" />
          </span>
          <div className="yg-callout__body">
            <strong className="yg-callout__title">Il reste une question</strong>
            <p className="m-0">
              Le chef de votre Daara est le premier recours ; il connaît votre
              situation mieux que n’importe quel écran. Pour un problème
              technique — un accès bloqué, un don qui n’apparaît pas —{" "}
              <Link href="/contact">écrivez au support</Link>.
            </p>
          </div>
        </div>

        <p className="mt-10 flex flex-wrap items-center gap-2 text-sm text-(--ax-text-subtle)">
          <Pill>{GUIDE_CHAPTERS.length} chapitres</Pill>
          <Pill>
            environ{" "}
            {GUIDE_CHAPTERS.reduce((sum, c) => sum + c.minutes, 0)} minutes de
            lecture
          </Pill>
          <Pill>{LEXIQUE.length} entrées au lexique</Pill>
        </p>
      </div>
    </main>
  );
}
