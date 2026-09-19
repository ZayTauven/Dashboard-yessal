import Link from "next/link";
import { Terme } from "../Terme";
import {
  Callout,
  Checklist,
  Ornament,
  Shot,
  Step,
  Steps,
  Ui,
} from "../primitives";

export default function PremiersPas() {
  return (
    <>
      <p>
        On n’ouvre pas un compte Yessal Gui tout seul. Une demande part,
        quelqu’un la regarde, puis l’accès s’ouvre. C’est
        une communauté, pas un service en libre accès — et cette étape de
        validation explique l’essentiel des questions posées au support.
      </p>

      <h2 id="deux-chemins">Deux chemins vers un compte</h2>
      <p>
        Selon la façon dont vous arrivez, le compte naît différemment — et le
        mot de passe n’a pas la même origine. C’est la seule
        différence, mais elle compte.
      </p>

      <ul>
        <li>
          <strong>Vous faites la demande vous-même</strong>, depuis la page
          publique. Vous choisissez votre mot de passe ; personne d’autre
          ne le connaît.
        </li>
        <li>
          <strong>Quelqu’un crée le compte pour vous</strong> — un
          administrateur, ou un <Terme mot="collecteur" /> sur le terrain qui a
          besoin de vous enregistrer tout de suite. Le mot de passe est alors{" "}
          <strong>provisoire</strong>, et au moins une autre personne le
          connaît.
        </li>
      </ul>

      <h2 id="demander-un-acces">Demander un accès</h2>

      <Steps>
        <Step title="Ouvrir la demande d'adhésion">
          <p>
            Depuis la page d’accueil publique, <Ui>Demander un accès</Ui>.
            Le formulaire tient sur un écran.
          </p>
        </Step>

        <Step title="Renseigner son identité">
          <p>
            Prénom, nom, adresse e-mail et téléphone. Les deux moyens de contact
            sont demandés : l’un sert à se connecter, l’autre à vous
            joindre. Le téléphone s’écrit au format international, avec
            l’indicatif du pays où vous vivez.
          </p>
        </Step>

        <Step title="Choisir son Daara">
          <p>
            Le champ cherche aussi bien par nom de{" "}
            <Terme mot="daara">Daara</Terme> que par zone. Si le vôtre ne vous
            revient pas, choisissez{" "}
            <Ui>Je ne sais pas encore</Ui> : un administrateur le renseignera.
            Mieux vaut un blanc qu’une erreur — seul un administrateur peut
            corriger un rattachement.
          </p>
        </Step>

        <Step title="Choisir un mot de passe">
          <p>
            Au moins six caractères, avec une majuscule, un chiffre et un
            caractère spécial. Il n’est pas transmis à l’administrateur
            qui validera : lui approuve une identité, pas un accès.
          </p>
        </Step>

        <Step title="Attendre la validation">
          <p>
            La demande part. Tant qu’un administrateur ne l’a pas
            approuvée, le compte reste <strong>en attente</strong> et la
            connexion est refusée. Ce n’est pas une panne.
          </p>
        </Step>
      </Steps>

      <Callout tone="warn" title="« Je ne peux pas me connecter »">
        <p className="m-0">
          Neuf fois sur dix, le compte attend encore sa validation. Le chef de
          votre Daara est le mieux placé pour la faire avancer : il connaît
          votre situation, et l’administrateur lui répondra plus vite
          qu’à un inconnu.
        </p>
      </Callout>

      <Ornament />

      <h2 id="premiere-connexion">La première connexion</h2>
      <p>
        Un seul champ pour s’identifier : <Ui>E-mail ou téléphone</Ui>.
        Les deux fonctionnent, avec le même mot de passe. Le téléphone
        s’écrit avec son indicatif — <code>+221…</code> — exactement comme
        à l’inscription.
      </p>

      <Shot
        src="/guide-assets/shots/login.webp"
        alt="L'écran de connexion : un champ e-mail ou téléphone, un champ mot de passe, un lien « Oublié ? » et le bouton Se connecter."
        url="yessal.sn/login"
        caption={
          <>
            <b>L’écran de connexion.</b> Le lien <b>Oublié ?</b>, à
            droite du champ de mot de passe, envoie un lien de réinitialisation
            à votre adresse.
          </>
        }
      />

      <h3>Le mot de passe provisoire</h3>
      <p>
        Si votre compte a été créé par quelqu’un d’autre, la
        plateforme vous le rappellera à chaque écran tant que vous ne
        l’aurez pas remplacé. Ce rappel n’est pas une formalité : le
        mot de passe a transité par une autre personne, parfois par un message
        écrit, et il peut avoir été le même pour toute une liste de membres
        importée d’un tableur.
      </p>

      <Callout tone="tip" title="Changez-le à la première connexion">
        <p className="m-0">
          Le remplacer <strong>déconnecte partout ailleurs</strong> : toutes les
          sessions ouvertes avec l’ancien mot de passe cessent
          immédiatement de fonctionner. C’est exactement l’effet
          recherché si vous soupçonnez quelqu’un d’utiliser votre
          compte.
        </p>
      </Callout>

      <h2 id="completer-son-profil">Compléter son profil</h2>
      <p>
        Une fois entré, un bandeau vous attend en haut de chaque écran tant que
        votre fiche est incomplète. Il nomme ce qui manque, et le bouton mène
        directement au premier champ vide.
      </p>

      <Shot
        src="/guide-assets/shots/bandeau-profil.webp"
        alt="Le bandeau « Complétez votre profil » nomme les informations manquantes et propose un bouton Compléter."
        url="yessal.sn/dashboard"
        width={1200}
        height={65}
        caption={
          <>
            <b>Le rappel de complétion.</b> Il disparaît de lui-même une fois
            les sept informations réunies.
          </>
        }
      />

      <p>Sept choses sont attendues :</p>
      <Checklist
        items={[
          "Prénom et nom",
          "Date de naissance",
          "Genre",
          "Photo de profil",
          "Pays de résidence",
          "Adresse complète et ville",
          "Une pièce d'identité téléversée",
        ]}
      />

      <p>
        Le détail de chacune — et ce que l’administration fait des pièces
        justificatives — se trouve dans{" "}
        <Link href="/guide/profil-documents">Profil, pièces et titre</Link>.
      </p>

      <Callout title="Pourquoi tant d'informations ?">
        <p className="m-0">
          Deux membres portent souvent le même nom. Le Daara, le titre, la fin
          du numéro de téléphone : c’est ce qui permet à un collecteur de
          savoir, face à deux <em>Amadou Ndiaye</em>, lequel des deux lui tend
          l’argent.
        </p>
      </Callout>
    </>
  );
}
