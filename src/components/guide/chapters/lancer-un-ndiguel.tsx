import Link from "next/link";
import { Terme } from "../Terme";
import {
  Amount,
  Callout,
  Checklist,
  Ornament,
  Shot,
  Step,
  Steps,
  Ui,
} from "../primitives";

export default function LancerUnNdiguel() {
  return (
    <>
      <p>
        Un <Terme mot="ndiguel" /> est une collecte : un nom, une raison, un
        objectif, une échéance. Tant qu’aucun n’est ouvert, la
        plateforme ne peut enregistrer aucun don — pas même une remise en
        espèces sur le terrain. C’est donc le premier geste de toute
        campagne, et il n’appartient qu’à l’administration.
      </p>

      <Callout tone="rule" title="Seule l'administration lance un Ndiguel">
        <p className="m-0">
          Ni un chef de <Terme mot="daara" />, ni un{" "}
          <Terme mot="collecteur" />, ni un talibé. Un chef de Daara peut en
          revanche <em>suivre</em> l’avancement des tâches d’un
          Ndiguel, même s’il n’en est pas l’organisateur : c’est
          voulu.
        </p>
      </Callout>

      <h2 id="creer">Créer le Ndiguel</h2>
      <p>
        <Ui>Les Ndiguels</Ui> → <Ui>Lancer un Ndiguel</Ui>, en haut à droite.
        Le formulaire tient sur un écran.
      </p>

      <Shot
        src="/guide-assets/shots/ndiguel-nouveau.webp"
        alt="Le formulaire de création d'un Ndiguel : nom, description, image, objectif financier, date limite, fête de rattachement et responsable."
        url="yessal.sn/dashboard/campaigns/new"
        caption={
          <>
            <b>Le formulaire.</b> Deux champs seulement sont obligatoires : le
            nom et la date limite. Tout le reste sert à donner envie ou à
            organiser.
          </>
        }
        priority
      />

      <Steps>
        <Step title="Nommer et expliquer">
          <p>
            Le nom apparaîtra sur la carte, dans la liste des Jëfs, dans les
            notifications. Qu’il dise la chose : <em>Contribution mur
            d’enceinte</em> plutôt que <em>Collecte 2026</em>.
          </p>
          <p>
            La description dit <strong>ce que finance ce Ndiguel, et
            pourquoi</strong>. C’est ce texte qu’on lit avant de
            décider d’un montant.
          </p>
        </Step>

        <Step title="Choisir une image">
          <p>
            Facultative, mais elle habille la carte dans la liste. Une liste de
            cartes sans image se parcourt beaucoup moins bien.
          </p>
        </Step>

        <Step title="Fixer l'objectif financier">
          <p>
            Facultatif, minimum <Amount>1 000 FCFA</Amount>. Sans objectif,
            aucune barre de progression n’est affichée — et la carte
            l’annonce : <em>« Ndiguel sans objectif chiffré : chaque
            contribution compte. »</em> C’est un choix légitime, pas un
            oubli.
          </p>
        </Step>

        <Step title="Fixer la date limite">
          <p>
            Obligatoire, et strictement postérieure à aujourd’hui. Elle
            n’est pas décorative : <strong>un Ndiguel dont
            l’échéance est passée bascule de lui-même en « terminé »</strong>{" "}
            et cesse d’accepter des dons, même si son statut dit encore
            « en cours ».
          </p>
        </Step>

        <Step title="Rattacher à une Fête">
          <p>
            Facultatif. Rattacher le Ndiguel au Magal, au Gamou ou à un
            rassemblement lui donne sa raison d’être, et permet de
            comparer d’une édition à l’autre.
          </p>
        </Step>

        <Step title="Désigner un responsable">
          <p>
            L’<Terme mot="organisateur" /> mène l’opération : il gère
            les tâches et peut ouvrir un salon d’organisation. Il se
            choisit dans <strong>n’importe quel Daara</strong>.
          </p>
        </Step>
      </Steps>

      <Callout tone="warn" title="Responsable et Daara ciblé ne sont pas la même chose">
        <p className="m-0">
          Un Ndiguel <strong>n’appartient à aucun Daara</strong>. Le Daara
          éventuellement ciblé est un périmètre de collecte ; l’organisateur
          est une personne. Les deux sont indépendants, et les afficher
          l’un pour l’autre a déjà induit en erreur.
        </p>
      </Callout>

      <Ornament />

      <h2 id="cycle-de-vie">Le cycle de vie</h2>
      <p>
        Un Ndiguel naît <strong>à venir</strong>. Il faut l’activer pour
        qu’il accepte des dons.
      </p>
      <ul>
        <li>
          <strong>À venir</strong> — créé, fermé aux dons. C’est le moment
          d’en relire le texte et d’ajuster l’objectif.
        </li>
        <li>
          <strong>En cours</strong> — ouvert. Les Jëfs entrent, la barre
          progresse. Une alerte part à l’administration quand{" "}
          <strong>90 % de l’objectif</strong> est atteint.
        </li>
        <li>
          <strong>Suspendu</strong> — mis de côté sans être clos.
        </li>
        <li>
          <strong>Terminé</strong> — clos par décision, ou par dépassement de
          l’échéance.
        </li>
      </ul>

      <Callout title="Modifier ou supprimer">
        <p className="m-0">
          Un Ndiguel ne se modifie librement que tant qu’il est{" "}
          <em>à venir</em> ou <em>suspendu</em>. Une fois qu’il a reçu des
          dons, le corriger revient à déplacer le sol sous des versements déjà
          faits. La correction d’une erreur de saisie reste possible — c’est
          une exception, pas la règle.
        </p>
      </Callout>

      <h2 id="suivre">Suivre l’avancement</h2>
      <p>
        <Ui>Gérer</Ui>, sur la carte, ouvre le suivi : les tâches à cocher, les
        Jëfs reçus, l’écart à l’objectif.{" "}
        <Ui>Voir l’état du Ndiguel</Ui> donne la vue détaillée, donateur
        par donateur.
      </p>
      <p>
        Pour la vue d’ensemble — quel Ndiguel rend, lequel stagne —{" "}
        <Ui>Performance Ndiguels</Ui> dans la section Administration compare
        les campagnes entre elles.
      </p>

      <Shot
        src="/guide-assets/shots/performance.webp"
        alt="L'écran Performance des Ndiguels : comparaison des campagnes, montants collectés et taux d'atteinte."
        url="yessal.sn/dashboard/admin/campaign-metrics"
        caption={
          <>
            <b>Performance des Ndiguels.</b> C’est ici qu’on voit
            qu’une campagne cale — assez tôt pour relancer.
          </>
        }
      />

      <h2 id="avant-de-lancer">Avant d’activer</h2>
      <Checklist
        items={[
          "Le nom dit la chose, pas l'année.",
          "La description répond à « qu'est-ce que je finance ? ».",
          "La date limite laisse le temps de collecter, sans être si lointaine qu'on oublie.",
          "L'objectif est atteignable — une barre bloquée à 12 % décourage plus qu'elle ne motive.",
          "Le responsable a été prévenu qu'il l'était.",
        ]}
      />

      <p>
        Les Fêtes auxquelles rattacher un Ndiguel se créent depuis{" "}
        <Ui>Fêtes</Ui> — voir{" "}
        <Link href="/guide/lexique#les-fetes">le lexique</Link> pour les trois
        rythmes possibles.
      </p>
    </>
  );
}
