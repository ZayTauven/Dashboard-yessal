import Image from "next/image";
import { MapPin, Sparkles } from "lucide-react";
import { LEXIQUE } from "@/lib/guide/lexique";
import { Callout, Ornament } from "../primitives";

/*
 * Le lexique se rend depuis `lib/guide/lexique.ts` : la même source alimente
 * les infobulles des termes cités en ligne dans les autres chapitres. Écrire
 * une définition à deux endroits, c'est garantir qu'elles divergeront.
 */

export default function Lexique() {
  return (
    <>
      <p>
        Dix mots. Ils viennent de trois langues, se croisent sur tous les écrans,
        et deux d’entre eux se confondent régulièrement. Une fois ceux-là
        posés, le reste de la plateforme se lit tout seul.
      </p>

      <Callout tone="warn" title="La confusion à ne plus faire">
        <p className="m-0">
          Un <strong>Jëf</strong> est un <strong>don</strong>. Un{" "}
          <strong>Ndiguel</strong> est la <strong>campagne</strong> dans
          laquelle ce don se range. On fait un Jëf <em>dans</em> un Ndiguel. Les
          toutes premières notes de cadrage du projet disaient l’inverse ;
          l’interface, elle, a tranché dans ce sens, et ce guide suit
          l’interface.
        </p>
      </Callout>

      <h2 id="les-mots">Les dix mots</h2>

      <div className="yg-lex">
        {LEXIQUE.map((term) => (
          <div key={term.id} id={term.id} className="yg-lex__item">
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
                <Sparkles
                  size={20}
                  className="text-(--ax-accent)"
                  aria-hidden="true"
                />
              )}
            </span>
            <div>
              <h3 className="yg-lex__word mt-0">
                {term.word}
                {term.origin && (
                  <span className="yg-lex__orig">{term.origin}</span>
                )}
              </h3>
              <p className="yg-lex__def m-0">{term.def}</p>
              {term.where && (
                <p className="yg-lex__where m-0">
                  <MapPin size={13} aria-hidden="true" />
                  Dans l’interface : <b>{term.where}</b>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Ornament />

      <h2 id="les-fetes">Les Fêtes citées par la plateforme</h2>
      <p>
        Une <strong>Fête</strong> est un événement auquel un Ndiguel peut se
        rattacher. La plateforme n’en impose aucune : l’administration
        crée celles dont la communauté a besoin, avec leur récurrence. Trois
        rythmes existent.
      </p>

      <ul>
        <li>
          <strong>Annuel</strong> — le Magal, le Gamou. La Fête revient chaque
          année, et un nouveau Ndiguel s’y rattache à chaque édition.
        </li>
        <li>
          <strong>Hebdomadaire</strong> — le Tog Ajumma, le rendez-vous du
          vendredi.
        </li>
        <li>
          <strong>Sans récurrence</strong> — un rassemblement, une occasion qui
          ne se répète pas. La date peut même rester à fixer.
        </li>
      </ul>

      <Callout title="Fête et Ndiguel ne sont pas la même chose">
        <p className="m-0">
          La Fête est l’<em>occasion</em> ; le Ndiguel est la{" "}
          <em>collecte</em> menée à cette occasion. Une même Fête peut porter
          plusieurs Ndiguels au fil des années, et un Ndiguel peut n’être
          rattaché à aucune Fête.
        </p>
      </Callout>

      <h2 id="les-statuts">Les mots des statuts</h2>
      <p>
        Trois séries de statuts se croisent. Elles ne se ressemblent pas et ne
        se remplacent jamais.
      </p>

      <h3>Le statut d’un Jëf</h3>
      <ul>
        <li>
          <strong>En attente</strong> — enregistré, pas encore validé. C’est
          l’état d’un versement en espèces tant qu’un
          administrateur ne l’a pas confirmé.
        </li>
        <li>
          <strong>Virement en attente</strong> — la référence du virement a été
          saisie, le rapprochement bancaire reste à faire.
        </li>
        <li>
          <strong>Confirmé</strong> — le don compte dans les totaux. Un paiement
          en ligne réussi arrive directement ici.
        </li>
        <li>
          <strong>Échoué</strong> — le paiement n’est pas passé. Rien
          n’a été encaissé, et le Jëf peut être refait.
        </li>
      </ul>

      <h3>Le statut d’un Ndiguel</h3>
      <ul>
        <li>
          <strong>À venir</strong> — créé, pas encore ouvert aux dons.
        </li>
        <li>
          <strong>En cours</strong> — ouvert. C’est le seul état dans
          lequel un Jëf peut être enregistré.
        </li>
        <li>
          <strong>Terminé</strong> — clos, ou échéance dépassée. Un Ndiguel dont
          la date limite est passée bascule de lui-même.
        </li>
        <li>
          <strong>Suspendu</strong> — mis de côté par l’administration.
        </li>
      </ul>

      <h3>Le statut d’un compte</h3>
      <ul>
        <li>
          <strong>En attente</strong> — l’inscription attend sa validation.
          La connexion est refusée.
        </li>
        <li>
          <strong>Actif</strong> — le compte fonctionne.
        </li>
        <li>
          <strong>Inactif</strong> — mis en sommeil.
        </li>
        <li>
          <strong>Bloqué</strong> — l’accès a été retiré. Seule
          l’administration peut le rendre.
        </li>
      </ul>
    </>
  );
}
