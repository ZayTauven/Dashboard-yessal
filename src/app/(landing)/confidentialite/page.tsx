import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/BrandMark";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description:
    "Quelles données Yessal Gui enregistre, qui les voit, et comment les faire corriger ou effacer.",
};

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Politique de confidentialité
 * ═══════════════════════════════════════════════════════════════════════════
 * Page PUBLIC, hors session : on doit pouvoir la lire AVANT de s'inscrire, et
 * le formulaire d'inscription y renvoie.
 *
 * Ce texte décrit ce que l'application fait RÉELLEMENT, relevé dans le code le
 * 2026-11-11 (modèles Django, sérialiseurs, réglages). Il ne promet rien que
 * le produit ne tienne : pas de délai d'effacement automatique, par exemple,
 * parce qu'aucun n'existe. Quand une règle change — un nouveau champ de profil,
 * un nouveau prestataire, une nouvelle règle de visibilité — cette page change
 * avec elle, et `MISE_A_JOUR` aussi.
 *
 * ⚠ PROVISOIRE (2026-11-11) : `RESPONSABLE` n'est pas le nom officiel de
 * l'entité, et la page ne donne AUCUNE adresse e-mail — celles qui traînent
 * dans le projet (`contact@yessalgui.sn`, `support@yessalgui.com`) ne sont pas
 * confirmées, et une demande d'effacement envoyée dans le vide est pire que
 * pas d'adresse. À compléter dès que le Kourel a tranché : remettre un
 * `mailto:` dans « Qui est responsable » et dans « Vos droits ».
 */
const MISE_A_JOUR = "11 novembre 2026";
const RESPONSABLE = "l’administration du Kourel";

export default function ConfidentialitePage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-10 sm:py-14">
      <header className="mb-8">
        <BrandMark href="/" size="md" />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          Politique de confidentialité
        </h1>
        <p className="ax-text-muted mt-2 text-sm">
          Dernière mise à jour : {MISE_A_JOUR}
        </p>
      </header>

      <article className="ax-prose">
        <p>
          Yessal Gui est l’outil du Kourel : il sert à suivre les Ndiguels, à
          enregistrer les Jëfs et à garder les membres en lien. Pour cela, il
          enregistre des informations sur vous. Cette page dit lesquelles, qui
          les voit, et ce que vous pouvez demander.
        </p>

        <h2>Qui est responsable de vos données</h2>
        <p>
          Vos données sont tenues par {RESPONSABLE}. Pour toute question ou
          demande, adressez-vous au coordinateur de votre Daara ou à un
          administrateur.
        </p>

        <h2>Ce que nous enregistrons</h2>
        <h3>Ce que vous nous donnez</h3>
        <ul>
          <li>
            <strong>Votre identité et vos coordonnées :</strong> prénom, nom,
            numéro de téléphone, adresse e-mail, et le Daara auquel vous êtes
            rattaché.
          </li>
          <li>
            <strong>Votre profil, si vous le complétez :</strong> photo, date
            de naissance, genre, pays de résidence, ville, adresse, situation
            matrimoniale et groupe sanguin. Aucun de ces champs n’est
            obligatoire pour faire un Jëf.
          </li>
          <li>
            <strong>Vos pièces d’identité,</strong> si vous les transmettez :
            la photo de la pièce et son numéro.
          </li>
          <li>
            <strong>Vos Jëfs :</strong> le Ndiguel, le montant, la date, le
            moyen de paiement, et votre choix de rester anonyme ou non.
          </li>
          <li>
            <strong>Les personnes sous votre tutelle :</strong> leur prénom,
            leur nom et leur lien avec vous.
          </li>
          <li>
            <strong>Vos échanges dans la messagerie :</strong> messages,
            photos, vidéos, notes vocales et documents.
          </li>
        </ul>

        <h3>Ce que l’application enregistre d’elle-même</h3>
        <ul>
          <li>La date de votre dernière activité.</li>
          <li>
            L’identifiant de votre téléphone ou de votre navigateur, pour vous
            envoyer les notifications.
          </li>
          <li>
            Un journal des modifications faites dans l’application : qui a
            créé, modifié ou supprimé quoi, et quand. L’administration seule le
            consulte.
          </li>
        </ul>
        <p>
          Votre mot de passe n’est jamais conservé en clair : seule une
          empreinte chiffrée l’est, et personne — pas même un administrateur —
          ne peut le relire.
        </p>

        <h2>Des données sensibles</h2>
        <p>
          Être inscrit sur Yessal Gui, c’est appartenir au Kourel : votre
          compte dit donc quelque chose de votre vie religieuse. Votre groupe
          sanguin, si vous le renseignez, est une donnée de santé. Nous
          traitons ces informations parce que vous avez demandé à rejoindre
          l’application, et nous ne les communiquons à personne en dehors du
          Kourel.
        </p>

        <h2>À quoi servent vos données</h2>
        <ul>
          <li>Vous identifier et protéger votre compte.</li>
          <li>
            Enregistrer vos Jëfs, en tenir le compte exact et vous en remettre
            la trace.
          </li>
          <li>
            Permettre à un collecteur de vous joindre quand vous demandez une
            collecte en espèces.
          </li>
          <li>
            Vous informer : notifications, annonces, et courriels liés à votre
            compte ou à vos Jëfs.
          </li>
          <li>Faire vivre la messagerie entre membres.</li>
        </ul>
        <p>
          Vos données ne sont ni vendues, ni louées, ni utilisées pour de la
          publicité. L’application ne contient aucun outil de mesure
          d’audience.
        </p>

        <h2>Qui voit quoi</h2>
        <ul>
          <li>
            <strong>L’administration du Kourel</strong> voit l’ensemble des
            comptes, des Jëfs et des pièces d’identité.
          </li>
          <li>
            <strong>Sangue Bi</strong> consulte le suivi du Kourel, sans le
            modifier.
          </li>
          <li>
            <strong>Le coordinateur de votre Daara</strong> voit les membres
            de son Daara et leurs Jëfs.
          </li>
          <li>
            <strong>Les collecteurs</strong> voient l’annuaire des membres,
            téléphone compris, pour organiser la collecte.
          </li>
          <li>
            <strong>Les autres membres de votre Daara</strong> voient votre
            nom, votre photo, votre téléphone et votre adresse e-mail dans
            l’annuaire.
          </li>
          <li>
            <strong>Vos messages</strong> ne sont lus que par les participants
            de la discussion ou du salon.
          </li>
        </ul>
        <p>
          Si vous choisissez de <strong>rester anonyme</strong> pour un Jëf,
          ni votre nom ni le montant ne sont montrés aux autres membres. Seuls
          l’administration, Sangue Bi et le collecteur qui reçoit votre argent
          savent que ce Jëf est le vôtre.
        </p>
        <p>
          Vos pièces d’identité et les fichiers de la messagerie ne s’ouvrent
          que par un lien temporaire, remis à qui a le droit de les voir.
        </p>

        <h2>Les prestataires qui nous aident</h2>
        <p>
          Quelques services extérieurs reçoivent une partie de vos données,
          dans la seule mesure nécessaire à leur tâche :
        </p>
        <ul>
          <li>
            <strong>Hostinger</strong> héberge l’application et sa base de
            données.
          </li>
          <li>
            <strong>Bictorys</strong> traite les paiements par Wave, Orange
            Money et carte. Il reçoit votre nom, votre téléphone, votre adresse
            e-mail et le montant. Yessal Gui ne voit ni ne conserve jamais vos
            numéros de carte ou vos codes.
          </li>
          <li>
            <strong>Google</strong> achemine les notifications sur votre
            téléphone (Firebase) et nos courriels (Gmail).
          </li>
          <li>
            <strong>Pusher</strong> fait apparaître les messages en direct.
          </li>
        </ul>
        <p>
          Certains de ces prestataires opèrent hors du Sénégal. Quand vous
          ouvrez une vidéo YouTube partagée dans l’application, vous êtes sur
          YouTube, qui applique ses propres règles.
        </p>

        <h2>Combien de temps nous les gardons</h2>
        <p>
          Vos données sont conservées tant que votre compte existe. Aucun
          effacement automatique n’est programmé.
        </p>
        <p>
          Vos Jëfs font partie des comptes du Kourel : ils restent au registre
          même si vous quittez l’application. Un compte qui a enregistré des
          Jëfs n’est donc pas supprimé mais fermé — vous ne pouvez plus vous y
          connecter, et vos contributions restent comptabilisées.
        </p>

        <h2>Cookies</h2>
        <p>
          Le site n’utilise que les cookies nécessaires à votre connexion. Vos
          préférences d’affichage et vos brouillons de message restent dans
          votre navigateur. Il n’y a aucun cookie publicitaire ni de suivi.
        </p>

        <h2>Vos droits</h2>
        <p>
          La loi sénégalaise n° 2008-12 sur la protection des données à
          caractère personnel vous donne le droit de :
        </p>
        <ul>
          <li>savoir quelles données nous détenons sur vous ;</li>
          <li>
            les faire corriger — la plupart se modifient directement dans
            votre profil ;
          </li>
          <li>demander leur effacement, dans la limite décrite plus haut ;</li>
          <li>vous opposer à un traitement.</li>
        </ul>
        <p>
          Pour exercer ces droits, adressez-vous au coordinateur de votre
          Daara ou à un administrateur. Si la réponse ne vous
          satisfait pas, vous pouvez saisir la Commission de protection des
          données personnelles (CDP) du Sénégal.
        </p>

        <h2>Si cette politique change</h2>
        <p>
          Toute modification est publiée sur cette page, avec sa date.
        </p>
      </article>

      <p className="mt-10">
        <Link href="/" className="ax-link text-sm">
          <ArrowLeft size={13} className="inline" aria-hidden="true" /> Retour à
          l’accueil
        </Link>
      </p>
    </div>
  );
}
