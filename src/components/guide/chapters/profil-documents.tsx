import Link from "next/link";
import { Terme } from "../Terme";
import { Callout, Checklist, Ornament, Shot, Ui } from "../primitives";

export default function ProfilDocuments() {
  return (
    <>
      <p>
        <Ui>Mon profil</Ui>, sous votre avatar en haut à droite. La page tient
        en trois onglets : <strong>Informations</strong>,{" "}
        <strong>Pièces d’identité</strong>, <strong>Sécurité</strong>. Une
        jauge de complétion, en haut, dit où vous en êtes.
      </p>

      <Shot
        src="/guide-assets/shots/membre-profil.webp"
        alt="La page Mon profil : avatar, jauge de complétion, demande de titre, et les trois onglets Informations, Pièces d'identité, Sécurité."
        url="yessal.sn/dashboard/profile"
        caption={
          <>
            <b>Mon profil.</b> La jauge compte sept critères. Elle ne disparaît
            qu’une fois les sept réunis — pièce d’identité comprise.
          </>
        }
        priority
      />

      <h2 id="informations">Les informations</h2>
      <p>
        Vous modifiez librement ce qui vous appartient : nom, date de naissance,
        genre, pays de résidence, adresse, ville, photo. Deux choses vous
        échappent, et c’est délibéré.
      </p>

      <ul>
        <li>
          <strong>Votre <Terme mot="daara" /></strong> — seul un administrateur
          le change. Des dons déjà enregistrés y pointent.
        </li>
        <li>
          <strong>Votre rôle</strong> — il se reçoit, il ne se choisit pas.
        </li>
      </ul>

      <Callout title="Pourquoi la photo compte">
        <p className="m-0">
          Ce n’est pas de la coquetterie. Un <Terme mot="collecteur" /> qui
          cherche <em>Amadou Ndiaye</em> et en trouve trois se décide sur le
          Daara, le titre et le visage. Une photo, c’est une seconde de
          moins à chaque encaissement — et une erreur d’attribution en
          moins.
        </p>
      </Callout>

      <Ornament />

      <h2 id="pieces">Les pièces d’identité</h2>
      <p>Quatre types de pièce sont acceptés :</p>
      <ul>
        <li>Carte Nationale d’Identité</li>
        <li>Passeport</li>
        <li>Carte d’Électeur</li>
        <li>Permis de Conduire</li>
      </ul>

      <p>
        Une seule pièce par type. Recto obligatoire, verso quand la pièce en a
        un. Le numéro peut être saisi, il n’est pas obligatoire.
      </p>

      <h3>Les trois états d’une pièce</h3>
      <ul>
        <li>
          <strong>En attente</strong> — téléversée, en cours d’examen par
          l’administration.
        </li>
        <li>
          <strong>Validé</strong> — acceptée. Le critère de complétion est
          rempli.
        </li>
        <li>
          <strong>À corriger</strong> — refusée, avec un motif. Le motif est
          affiché : lisez-le avant de renvoyer la même image.
        </li>
      </ul>

      <Callout tone="tip" title="Photographier une pièce">
        <p>
          À plat, en pleine lumière, sans reflet, les quatre coins dans le
          cadre. Le plus fréquent des refus tient à un angle rogné ou à un
          éclat de flash sur l’hologramme.
        </p>
        <p className="m-0">
          N’écrasez pas l’image avant de l’envoyer : la
          plateforme accepte de grosses photographies et se charge de les
          réduire. Une image trop compressée devient illisible, et c’est
          exactement ce qu’on vous demandera de refaire.
        </p>
      </Callout>

      <h2 id="titre">Demander un titre</h2>
      <p>
        Le <Terme mot="titre" /> est la distinction portée à côté de votre nom
        dans les listes et les annuaires. Vous le <strong>demandez</strong> ;
        l’administration l’accorde ou le refuse.
      </p>
      <p>
        La liste des titres disponibles est tenue par l’administration :
        vous choisissez dedans, vous n’en inventez pas. Et{" "}
        <strong>une seule modification est autorisée</strong> — la carte le dit
        sous son titre. Réfléchissez avant d’envoyer la demande.
      </p>

      <h2 id="securite">L’onglet Sécurité</h2>
      <p>
        C’est ici que l’on change son mot de passe. Le geste a une
        conséquence qu’il faut connaître : il{" "}
        <strong>met fin à toutes les sessions ouvertes</strong>, sur tous les
        appareils, immédiatement. Vous serez déconnecté ailleurs — et celui qui
        utilisait votre compte à votre insu aussi.
      </p>
      <p>
        Le détail est dans{" "}
        <Link href="/guide/securite">Sécurité et traçabilité</Link>.
      </p>

      <h2 id="checklist">Un profil complet, en une fois</h2>
      <Checklist
        items={[
          "Prénom et nom, tels qu'ils figurent sur votre pièce d'identité.",
          "Date de naissance et genre.",
          "Une photo de vous, prise de face, récente.",
          "Pays de résidence — celui où vous vivez, pas celui de votre Daara.",
          "Adresse complète et ville.",
          "Une pièce d'identité, recto et verso, lisible.",
        ]}
      />

      <Callout title="Le bandeau disparaît tout seul">
        <p className="m-0">
          Le rappel en haut des écrans s’efface dès que les sept critères
          sont réunis. Tant qu’il est là, il nomme précisément ce qui
          manque, et son bouton mène au premier champ vide — pas à un sommaire.
        </p>
      </Callout>
    </>
  );
}
