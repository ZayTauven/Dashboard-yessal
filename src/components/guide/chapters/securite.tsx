import Link from "next/link";
import { Terme } from "../Terme";
import { Callout, Ornament, Shot, Ui } from "../primitives";

export default function Securite() {
  return (
    <>
      <p>
        Une plateforme qui touche à l’argent d’une communauté doit
        pouvoir répondre à deux questions : <em>qui a fait quoi</em>, et{" "}
        <em>qui peut voir quoi</em>. Ce chapitre répond aux deux, et dit aussi
        ce que la plateforme ne protège pas.
      </p>

      <h2 id="mot-de-passe">Le mot de passe</h2>
      <p>
        Au moins six caractères, avec une majuscule, un chiffre et un caractère
        spécial. Après trois tentatives échouées, le compte se bloque — seul un
        administrateur peut le rouvrir.
      </p>

      <Callout tone="rule" title="Changer son mot de passe déconnecte partout">
        <p>
          Ce n’est pas un effet de bord, c’est la fonction. Un jeton
          de session reste valable par lui-même jusqu’à son expiration :
          changer le mot de passe ne suffisait pas à en priver quelqu’un
          qui était déjà entré — c’est pourtant exactement le cas où
          l’on réinitialise.
        </p>
        <p className="m-0">
          Désormais, le changement <strong>invalide d’un coup toutes les
          sessions ouvertes</strong>, sur tous les appareils. Vous devrez vous
          reconnecter ; celui qui utilisait votre compte aussi, et il ne le
          pourra pas.
        </p>
      </Callout>

      <p>
        Si vous avez reçu un mot de passe que vous n’avez pas choisi —
        compte créé par un administrateur, inscription rapide par un{" "}
        <Terme mot="collecteur" />, import d’une liste — la plateforme vous
        le rappellera à chaque écran. Ce rappel ne s’éteint que quand vous
        le remplacez. D’autres personnes connaissent ce mot de passe, et
        parfois toute une promotion a reçu le même.
      </p>

      <h2 id="mot-de-passe-oublie">Mot de passe oublié</h2>
      <p>
        <Ui>Oublié ?</Ui> sur l’écran de connexion envoie un lien à
        votre adresse. Le lien a une durée de vie limitée et ne sert
        qu’une fois.
      </p>

      <Shot
        src="/guide-assets/shots/mot-de-passe-oublie.webp"
        alt="L'écran de réinitialisation : un champ pour l'adresse e-mail et un bouton d'envoi du lien."
        url="yessal.sn/forgot-password"
        caption={
          <>
            <b>Réinitialiser l’accès.</b> Sans adresse e-mail au dossier,
            il faut passer par un administrateur — d’où l’intérêt de
            renseigner les deux moyens de contact.
          </>
        }
      />

      <Ornament />

      <h2 id="anonymat">Le don anonyme</h2>
      <p>
        Un <Terme mot="jef" /> peut être enregistré sans que votre nom
        apparaisse dans les listes consultées par la communauté. Il faut être
        précis sur ce que cela veut dire :
      </p>
      <ul>
        <li>
          <strong>Anonyme aux yeux de la communauté</strong> — votre nom ne
          s’affiche pas à côté du montant.
        </li>
        <li>
          <strong>Pas anonyme aux yeux de la comptabilité</strong> — le don
          reste rattaché à votre compte. Il faut bien que quelqu’un puisse
          répondre, un jour, à « ce versement, d’où vient-il ? ».
        </li>
      </ul>

      <Callout tone="warn" title="L'anonymat n'est pas l'effacement">
        <p className="m-0">
          Si vous cherchez à ce qu’<em>absolument personne</em> ne puisse
          relier ce don à vous, la plateforme n’est pas l’outil : un
          registre dont on ne peut pas remonter les entrées ne vaut rien comme
          registre. Remettez alors la somme de la main à la main, sans
          enregistrement.
        </p>
      </Callout>

      <h2 id="qui-voit-quoi">Qui voit vos informations</h2>
      <ul>
        <li>
          <strong>Votre profil</strong> — les membres de votre{" "}
          <Terme mot="daara" /> voient votre nom, votre titre et votre avatar.
          Votre adresse, votre date de naissance et vos pièces d’identité
          ne sont visibles que de l’administration.
        </li>
        <li>
          <strong>Vos pièces d’identité</strong> — de
          l’administration seule, et uniquement pour les valider.
        </li>
        <li>
          <strong>Vos Jëfs</strong> — de vous, de l’administration, et du
          chef de votre Daara pour ceux qui concernent son Daara.
        </li>
        <li>
          <strong>Vos messages</strong> — des personnes présentes dans la
          conversation.
        </li>
      </ul>

      <Callout title="Qui peut vous écrire">
        <p className="m-0">
          N’importe quel membre — <strong>tant que vous
          l’acceptez</strong>. La limite est votre préférence, pas le Daara
          de celui qui écrit. Vos réglages de visibilité et d’invitation
          sont dans <Ui>Profil</Ui> → <Ui>Paramètres</Ui>.
        </p>
      </Callout>

      <h2 id="audit">Le journal d’audit</h2>
      <p>
        Les actions qui engagent sont consignées : qui, quoi, quand, sur quel
        objet. Validation d’un versement, changement de rôle, modification
        d’un Daara, suppression. Le journal se lit depuis{" "}
        <Ui>Logs d’audit</Ui>, dans la section Administration, et il est{" "}
        <strong>réservé aux administrateurs</strong>.
      </p>

      <Shot
        src="/guide-assets/shots/audit.webp"
        alt="Le journal d'audit : une ligne par action, avec son auteur, l'objet concerné et l'horodatage."
        url="yessal.sn/dashboard/admin/audit"
        caption={
          <>
            <b>Le journal d’audit.</b> Il n’existe pas pour surveiller
            les personnes mais pour répondre aux questions : quand un chiffre
            surprend, il dit <i>quand</i> et <i>par qui</i> il a changé.
          </>
        }
      />

      <h2 id="conservation">Ce qui est conservé</h2>
      <ul>
        <li>
          <strong>Les Ndiguels clôturés</strong> — conservés cinq ans, pour
          l’audit.
        </li>
        <li>
          <strong>Les Jëfs</strong> — conservés avec leur Ndiguel. Un don ne
          s’efface pas : on ne réécrit pas un registre.
        </li>
        <li>
          <strong>Les comptes sans activité</strong> — au-delà de six mois sans
          connexion, un compte peut être désactivé et archivé. Il se rouvre sur
          demande.
        </li>
      </ul>

      <h2 id="bons-reflexes">Quatre réflexes</h2>
      <ul>
        <li>
          Changez un mot de passe provisoire <strong>à la première
          connexion</strong>, pas « plus tard ».
        </li>
        <li>
          Un lien reçu par message qui demande vos identifiants ne vient pas de
          la plateforme. Yessal Gui ne demande jamais votre mot de passe en
          dehors de l’écran de connexion.
        </li>
        <li>
          Un paiement se termine toujours sur le site de l’opérateur —
          Orange Money, Wave, la banque. La plateforme ne voit ni votre code ni
          votre numéro de carte.
        </li>
        <li>
          Un doute sur votre compte : changez le mot de passe, cela ferme
          immédiatement toutes les sessions. Puis prévenez un administrateur.
        </li>
      </ul>

      <p>
        Pour ce que fait l’administration de vos pièces justificatives,
        voir{" "}
        <Link href="/guide/profil-documents">Profil, pièces et titre</Link>.
      </p>
    </>
  );
}
