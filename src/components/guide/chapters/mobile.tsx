import Link from "next/link";
import { Terme } from "../Terme";
import { Callout, Ornament, Phone, Phones, Ui } from "../primitives";

export default function Mobile() {
  return (
    <>
      <p>
        L’essentiel des talibés ne s’assoira jamais devant un
        ordinateur pour faire un <Terme mot="jef" />. L’application mobile
        existe pour eux : les mêmes données, les mêmes règles, mais un écran de
        quatre pouces et un pouce pour tout faire.
      </p>

      <h2 id="ce-quon-y-trouve">Ce qu’on y trouve</h2>

      <Phones>
        <Phone
          src="/guide-assets/mobile/accueil.webp"
          alt="L'accueil de l'application mobile : le rappel de complétion de profil, le carrousel des Ndiguels en cours, les tutelles, les actualités du Daara."
          caption="L'accueil."
        />
        <Phone
          src="/guide-assets/mobile/ndiguels.webp"
          alt="La liste des Ndiguels sur mobile, avec les filtres Tous, En cours, Clôturés, À venir."
          caption="Les Ndiguels."
        />
        <Phone
          src="/guide-assets/mobile/paiement.webp"
          alt="L'écran du moyen de paiement sur mobile : le montant du Jëf, puis Orange Money, Wave, carte bancaire, virement et collecteur."
          caption="Le paiement."
        />
      </Phones>

      <p>
        Cinq emplacements dans la barre du bas, et le geste central y occupe la
        place centrale :
      </p>
      <ul>
        <li>
          <strong>Accueil</strong> — les <Terme mot="ndiguel">Ndiguels</Terme>{" "}
          en cours en carrousel, vos <Terme mot="tutelle">tutelles</Terme>, les
          actualités de votre <Terme mot="daara" />.
        </li>
        <li>
          <strong>Ndiguels</strong> — la liste complète, filtrable :{" "}
          <Ui>Tous</Ui>, <Ui>En cours</Ui>, <Ui>Clôturés</Ui>, <Ui>À venir</Ui>.
        </li>
        <li>
          <strong>Le bouton rond, au milieu</strong> — faire un Jëf. Il est plus
          gros et plus haut que les autres parce que c’est le geste qui
          compte.
        </li>
        <li>
          <strong>Messages</strong> — les conversations.
        </li>
        <li>
          <strong>Profil</strong> — vos informations, vos documents, vos
          réglages.
        </li>
      </ul>

      <Callout tone="tip" title="Le compte à rebours">
        <p className="m-0">
          Chaque Ndiguel affiche <b>J−55</b>, <b>J−35</b> : le nombre de jours
          restant avant l’échéance. C’est l’information la plus
          utile de la liste, et elle est absente du web — là-bas, il faut lire
          la date.
        </p>
      </Callout>

      <Ornament />

      <h2 id="faire-un-jef-mobile">Faire un Jëf depuis le téléphone</h2>
      <p>
        Le même circuit que sur le web, en trois écrans : le Ndiguel, le
        montant, le moyen de paiement. L’écran de paiement rappelle le
        montant en haut, avec un <Ui>Modifier</Ui> à portée de pouce — parce
        qu’on se trompe d’un zéro plus souvent qu’on ne
        l’avoue.
      </p>
      <p>
        Les cinq moyens sont les mêmes qu’au{" "}
        <Link href="/guide/faire-un-jef">chapitre sur le Jëf</Link>, avec une
        mention utile sous chacun : <em>sans frais</em> pour le mobile money,{" "}
        <em>référence à saisir</em> pour le virement, <em>espèces, en main
        propre</em> pour le collecteur.
      </p>

      <h2 id="notifications">Les notifications</h2>
      <p>
        C’est ce que le téléphone apporte et que le web ne peut pas : la
        plateforme vous prévient sans que vous l’ouvriez.
      </p>
      <ul>
        <li>
          <strong>Un Ndiguel s’ouvre</strong> — l’annonce part aux
          membres concernés.
        </li>
        <li>
          <strong>L’échéance approche</strong> — rappels à trois jours,
          puis à un jour.
        </li>
        <li>
          <strong>Votre don est enregistré</strong> — confirmation dans les
          minutes qui suivent.
        </li>
        <li>
          <strong>Un message vous attend</strong> — dans une conversation où
          vous êtes.
        </li>
      </ul>
      <p>
        Le détail se règle dans <Ui>Profil</Ui> → <Ui>Paramètres</Ui> : on peut
        couper ce qu’on ne veut pas recevoir.
      </p>

      <Phones>
        <Phone
          src="/guide-assets/mobile/profil.webp"
          alt="L'écran de profil sur mobile."
          caption="Le profil."
        />
        <Phone
          src="/guide-assets/mobile/parametres.webp"
          alt="Les paramètres sur mobile, dont les préférences de notification."
          caption="Les paramètres."
        />
        <Phone
          src="/guide-assets/mobile/tutelles.webp"
          alt="Mes tutelles sur mobile."
          caption="Les tutelles."
        />
      </Phones>

      <h2 id="web-ou-mobile">Web ou mobile ?</h2>
      <p>
        Les deux voient les mêmes données ; le choix tient à ce qu’on veut
        faire.
      </p>
      <ul>
        <li>
          <strong>Le téléphone</strong> — donner, suivre, lire, répondre. Tout
          ce qui se fait debout, en quelques secondes.
        </li>
        <li>
          <strong>Le web</strong> — lancer un Ndiguel, valider des versements,
          tenir les listes, écrire une actualité, consulter le journal
          d’audit. Tout ce qui demande de la place et du temps.
        </li>
      </ul>

      <Callout title="Un chef de Daara sur téléphone">
        <p className="m-0">
          Il y retrouve son Daara et ses membres, mais la gestion fine — les
          listes longues, les fiches complètes, les exports — reste plus
          confortable sur le web. Le mobile est fait pour suivre, pas pour
          administrer.
        </p>
      </Callout>
    </>
  );
}
