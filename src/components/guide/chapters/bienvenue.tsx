import Image from "next/image";
import Link from "next/link";
import { Globe, HeartHandshake, ListChecks, Wallet } from "lucide-react";
import { Terme } from "../Terme";
import {
  Callout,
  Card,
  Cards,
  Checklist,
  Ornament,
  Shot,
} from "../primitives";

export default function Bienvenue() {
  return (
    <>
      <p>
        Yessal Gui est l’outil par lequel la communauté enregistre ses
        dons. Rien de plus, rien de moins : un endroit unique où l’on sait
        ce qui a été donné, par qui, pour quelle occasion — que le versement
        soit parti d’un téléphone à Dakar ou d’un virement depuis
        Milan.
      </p>
      <p>
        Avant, cela tenait dans des carnets, des groupes de messagerie et la
        mémoire de quelques personnes. Cela fonctionnait tant que le Daara
        tenait dans une pièce. Il n’y tient plus.
      </p>

      <h2 id="ce-que-fait-la-plateforme">Ce que fait la plateforme</h2>

      <Cards cols={2}>
        <Card title="Elle range les dons" icon={<Wallet size={18} />}>
          Chaque <Terme mot="jef" /> est rattaché à un{" "}
          <Terme mot="ndiguel" />, porte un montant, une date, un moyen de
          paiement et un statut. On peut le retrouver des années plus tard.
        </Card>
        <Card title="Elle tient la communauté" icon={<Globe size={18} />}>
          Les membres, les <Terme mot="daara">Daaras</Terme>, les zones
          territoriales, les chefs et les collecteurs : une seule liste, tenue à
          jour, consultable.
        </Card>
        <Card title="Elle relie les familles" icon={<HeartHandshake size={18} />}>
          Un don fait au nom d’une mère, d’un enfant ou d’un
          disparu garde le nom du bénéficiaire. C’est la{" "}
          <Terme mot="tutelle" />.
        </Card>
        <Card title="Elle laisse une trace" icon={<ListChecks size={18} />}>
          Validations, modifications, suppressions : les actions qui engagent
          sont journalisées, avec leur auteur et leur horodatage.
        </Card>
      </Cards>

      <Callout tone="rule" title="Ce qu'elle ne fait pas">
        <p className="m-0">
          Elle ne décide de rien. Les consignes, les occasions, les montants
          attendus, la vie du Daara : tout cela se dit ailleurs, entre les
          personnes concernées. La plateforme enregistre les conséquences, elle
          n’écrit pas les causes.
        </p>
      </Callout>

      <h2 id="trois-mondes">Trois écrans pour une même communauté</h2>
      <p>
        Selon qui vous êtes et ce que vous faites, vous rencontrerez la
        plateforme sous trois formes. Ce sont les mêmes données, présentées
        pour la main qui les manipule.
      </p>

      <Shot
        src="/guide-assets/shots/dashboard.webp"
        alt="Le tableau de bord de l'administration : montant collecté, membres actifs, contributions, Ndiguels en cours, et deux graphiques."
        url="yessal.sn/dashboard"
        caption={
          <>
            <b>Le tableau de bord.</b> Ce qu’un administrateur voit en
            ouvrant la plateforme : la collecte du réseau, les adhésions, les
            Ndiguels en cours. Un chef de Daara voit le même écran, borné à son
            Daara.
          </>
        }
        priority
      />

      <ul>
        <li>
          <strong>Le web</strong> — pour tout ce qui se fait assis : lancer un
          Ndiguel, valider des versements, tenir les listes, écrire une
          actualité.
        </li>
        <li>
          <strong>Le téléphone</strong> — pour tout ce qui se fait debout :
          faire un Jëf, lire les Ndiguels en cours, répondre à un message.{" "}
          <Link href="/guide/mobile">Le chapitre dédié</Link> le détaille.
        </li>
        <li>
          <strong>La collecte sur le terrain</strong> — un écran unique, pensé
          pour être utilisé à bout de bras, face à quelqu’un qui tend de
          l’argent.
        </li>
      </ul>

      <Ornament />

      <h2 id="lire-ce-guide">Comment lire ce guide</h2>
      <p>
        Treize chapitres, mais personne n’a besoin des treize.{" "}
        <Link href="/guide#par-ou-commencer">
          Indiquez votre profil sur la page d’accueil du guide
        </Link>
        : la liste se réduit à ce qui vous concerne, et le rail de gauche garde
        la trace de ce que vous avez lu.
      </p>

      <Checklist
        items={[
          "Vous venez d'obtenir un accès → « Ouvrir son compte », puis « Se repérer dans l'interface ».",
          "Un mot vous échappe → « Les mots de la maison », ou l'infobulle sur chaque terme souligné.",
          "Vous cherchez un geste précis → la recherche, en haut à droite, ou ⌘K.",
          "Vous voulez savoir si vous avez le droit → « Qui fait quoi », et son tableau.",
        ]}
      />

      <div className="mt-10 flex items-center gap-4 rounded-(--ax-radius-lg) border border-(--ax-border) bg-(--ax-surface-subtle) p-4">
        <Image
          className="yg-picto flex-none"
          src="/guide-assets/pictos/solidarite.png"
          alt=""
          width={72}
          height={72}
        />
        <p className="m-0 text-sm text-(--ax-text-muted)">
          Les termes <Terme mot="jef">soulignés comme celui-ci</Terme> viennent
          du lexique : survolez-les pour la définition courte, cliquez pour la
          longue.
        </p>
      </div>
    </>
  );
}
