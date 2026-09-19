import Link from "next/link";
import { Terme } from "../Terme";
import {
  Amount,
  Callout,
  Detail,
  Ornament,
  Pay,
  Pays,
  Shot,
  Step,
  Steps,
  Ui,
} from "../primitives";

/*
 * Les logos de paiement viennent de `public/payment/` — les mêmes fichiers que
 * ceux du formulaire de don, recadrés une fois pour toutes sur leur boîte
 * d'encre. En recopier une autre version dans /guide/ aurait garanti qu'un
 * jour les deux divergent (voir le préambule de lib/payment-methods.ts).
 */

export default function FaireUnJef() {
  return (
    <>
      <p>
        C’est le geste central de la plateforme, et il tient en trois
        décisions : <strong>à quel Ndiguel</strong>, <strong>combien</strong>,{" "}
        <strong>par quel moyen</strong>. Le reste se déroule tout seul.
      </p>

      <h2 id="ou-commencer">Où commencer</h2>
      <p>
        Par <Ui>Les Ndiguels</Ui> dans le rail. Un <Terme mot="jef" /> se fait
        toujours <em>dans</em> un <Terme mot="ndiguel" /> : il n’existe pas
        de don flottant, sans campagne.
      </p>

      <Shot
        src="/guide-assets/shots/ndiguels.webp"
        alt="La liste des Ndiguels sous forme de cartes, avec pour chacune une photo, une barre de progression, l'objectif, le collecté et un bouton Faire un Jëf."
        url="yessal.sn/dashboard/campaigns"
        caption={
          <>
            <b>Les Ndiguels.</b> Les onglets du haut comptent avant de filtrer —{" "}
            <b>En cours 3</b>, <b>À venir 1</b>. Seuls les Ndiguels{" "}
            <b>en cours</b> acceptent un Jëf.
          </>
        }
        priority
      />

      <p>Chaque carte dit l’essentiel sans qu’on l’ouvre :</p>
      <ul>
        <li>
          Le <strong>statut</strong>, en pastille sur la photo.
        </li>
        <li>
          Le <strong>responsable</strong> — l’<Terme mot="organisateur" />{" "}
          désigné pour mener l’opération.
        </li>
        <li>
          La <strong>progression</strong> vers l’objectif, en pourcentage
          et en francs. Un Ndiguel peut n’avoir aucun objectif chiffré :
          la carte l’annonce alors explicitement plutôt que d’afficher
          une barre à zéro.
        </li>
      </ul>

      <h2 id="les-trois-etapes">Les trois étapes</h2>

      <Steps>
        <Step title="Ouvrir la fenêtre de don">
          <p>
            <Ui>Faire un Jëf</Ui>, en bas de la carte. Le nom du Ndiguel est
            rappelé sous le titre de la fenêtre : vérifiez-le, c’est la
            seule erreur qu’on ne peut pas rattraper soi-même.
          </p>
        </Step>

        <Step title="Saisir le montant">
          <p>
            En francs CFA, sans séparateur. Le minimum accepté est de{" "}
            <Amount>1 000 FCFA</Amount>.
          </p>
        </Step>

        <Step title="Choisir le moyen de paiement">
          <p>
            Cinq possibilités, détaillées plus bas. Le choix détermine ce qui se
            passe après <Ui>Confirmer le paiement</Ui> : une redirection vers
            l’opérateur, ou un enregistrement immédiat en attente de
            validation.
          </p>
        </Step>
      </Steps>

      <Detail
        src="/guide-assets/shots/modale-jef.webp"
        alt="La fenêtre « Faire un Jëf » : le nom du Ndiguel, le champ montant en FCFA, les cinq moyens de paiement et le bouton Confirmer le paiement."
        width={900}
        height={970}
        caption={
          <>
            <b>La fenêtre de don.</b> Le nom du Ndiguel — ici{" "}
            <i>Soutien aux familles</i> — s’affiche sous le titre. Le
            montant s’écrit en chiffres bruts : <b>5000</b>, pas
            « 5 000 ».
          </>
        }
      />

      <Ornament />

      <h2 id="moyens-de-paiement">Les cinq moyens de paiement</h2>

      <Pays>
        <Pay logo="/payment/orange-money.png" name="Orange Money">
          Redirection vers l’opérateur. Confirmation automatique si le
          paiement aboutit.
        </Pay>
        <Pay logo="/payment/wave.png" name="Wave">
          Même principe : vous quittez la plateforme, vous payez, vous revenez.
        </Pay>
        <Pay logo="/payment/visa.png" name="Carte bancaire">
          Pour la diaspora surtout. Le paiement part vers la page sécurisée de
          l’établissement.
        </Pay>
        <Pay logo="/payment/banque.png" name="Virement bancaire">
          Vous saisissez la référence du virement. Le Jëf reste{" "}
          <em>en attente</em> jusqu’au rapprochement bancaire.
        </Pay>
        <Pay logo="/payment/especes.png" name="Espèces (collecteur)">
          Vous remettez l’argent de la main à la main. C’est le{" "}
          <Terme mot="collecteur" /> qui enregistre — voir{" "}
          <Link href="/guide/collecte-physique">le chapitre dédié</Link>.
        </Pay>
      </Pays>

      <Callout tone="warn" title="Une redirection n'est pas un échec">
        <p className="m-0">
          Orange Money, Wave et la carte vous font quitter Yessal Gui pour la
          page de l’opérateur. C’est normal, et c’est même ce
          qu’il faut : la plateforme ne voit jamais votre code ni votre
          numéro de carte. Laissez le paiement aller à son terme et revenez —
          le statut se met à jour de lui-même.
        </p>
      </Callout>

      <h2 id="statuts">Lire le statut de son Jëf</h2>
      <p>
        <Ui>Mes Jëfs</Ui> dans le rail donne l’historique. Quatre états
        possibles, et ils ne veulent pas dire la même chose.
      </p>

      <ul>
        <li>
          <strong>Confirmé</strong> — le don est acquis et compte dans les
          totaux du Ndiguel.
        </li>
        <li>
          <strong>En attente</strong> — enregistré, non encore validé.
          C’est l’état normal d’un versement en espèces : un
          administrateur le confirme, en principe sous vingt-quatre heures.
        </li>
        <li>
          <strong>Virement en attente</strong> — la référence est connue, le
          rapprochement reste à faire. Ce délai dépend de la banque, pas de la
          plateforme.
        </li>
        <li>
          <strong>Échoué</strong> — rien n’a été encaissé. Vous pouvez
          refaire le Jëf, ou changer de moyen de paiement.
        </li>
      </ul>

      <Shot
        src="/guide-assets/shots/membre-jefs.webp"
        alt="La liste « Mes Jëfs » : une ligne par don, avec le Ndiguel, le montant, le moyen de paiement et le statut."
        url="yessal.sn/dashboard/donations"
        caption={
          <>
            <b>Mes Jëfs.</b> Une ligne par don. Le moyen de paiement est montré
            par son logo — dans une liste de trente lignes, on reconnaît une
            marque bien plus vite qu’on ne lit une colonne de texte.
          </>
        }
      />

      <h2 id="au-nom-dun-proche">Donner au nom d’un proche</h2>
      <p>
        Le don reste le vôtre, mais il porte le nom du bénéficiaire. Il faut
        d’abord avoir enregistré la personne comme{" "}
        <Terme mot="tutelle" /> : la marche à suivre est dans{" "}
        <Link href="/guide/tutelles">Donner au nom d’un proche</Link>.
      </p>

      <Callout title="Le don anonyme">
        <p className="m-0">
          Un Jëf peut être enregistré sans que votre nom apparaisse dans les
          listes publiques. Il reste rattaché à votre compte : anonyme aux yeux
          de la communauté, pas aux yeux de la comptabilité. Voir{" "}
          <Link href="/guide/securite">Sécurité et traçabilité</Link>.
        </p>
      </Callout>

      <h2 id="ce-qui-peut-bloquer">Ce qui peut bloquer</h2>
      <ul>
        <li>
          <strong>Le bouton n’apparaît pas</strong> — le Ndiguel n’est
          pas <em>en cours</em>. Un Ndiguel à venir, suspendu ou terminé
          n’accepte aucun don.
        </li>
        <li>
          <strong>Le montant est refusé</strong> — il est en dessous de{" "}
          <Amount>1 000 FCFA</Amount>, ou contient un espace ou une virgule.
        </li>
        <li>
          <strong>Le paiement échoue à l’opérateur</strong> — solde,
          plafond, ou réseau. Le Jëf est alors marqué <em>échoué</em>, et rien
          n’a été prélevé.
        </li>
      </ul>
    </>
  );
}
