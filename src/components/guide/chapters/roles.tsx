import Link from "next/link";
import { Terme } from "../Terme";
import { Callout, Matrix, Ornament, Shot } from "../primitives";

export default function Roles() {
  return (
    <>
      <p>
        Cinq rôles. Ils ne décrivent pas une hiérarchie de dignité mais une
        répartition de gestes : qui encaisse, qui valide, qui ouvre une
        collecte. Un même écran ne montre pas la même chose selon celui qui
        l’ouvre, et c’est voulu.
      </p>

      <h2 id="les-cinq">Les cinq rôles</h2>

      <ul>
        <li>
          <strong>Talibé</strong> — le rôle par défaut. Il fait ses{" "}
          <Terme mot="jef">Jëfs</Terme>, suit les{" "}
          <Terme mot="ndiguel">Ndiguels</Terme>, enregistre ses{" "}
          <Terme mot="tutelle">tutelles</Terme>, consulte son{" "}
          <Terme mot="daara" />.
        </li>
        <li>
          <strong>Chef de Daara</strong> — tout ce que fait un talibé, plus la
          vue d’ensemble de son Daara : ses membres, ses collecteurs, ses
          Jëfs. Il propose des candidats collecteurs et ouvre des salons de
          discussion.
        </li>
        <li>
          <strong>Collecteur</strong> — il encaisse en personne et enregistre le
          versement pour le compte du donateur. Il garde par ailleurs son
          activité de talibé : ses propres Jëfs restent les siens.
        </li>
        <li>
          <strong>Administrateur</strong> — il lance les Ndiguels, crée les
          Fêtes, valide les versements et les pièces, tient les Daaras et les
          zones, et lit le journal d’audit.
        </li>
        <li>
          <strong>Tutelle</strong> — un compte de consultation. Il appartient à
          une personne au nom de laquelle on donne, et qui souhaite voir ce qui
          a été versé pour elle. Il ne fait rien d’autre.
        </li>
      </ul>

      <Callout tone="rule" title="La règle qui surprend : rien n'est borné au Daara">
        <p>
          On suppose souvent qu’un collecteur ne collecte que dans son
          Daara, qu’un chef ne parle qu’aux siens. C’est faux, et
          délibérément.
        </p>
        <p className="m-0">
          Un collecteur encaisse auprès de <strong>n’importe quel</strong>{" "}
          membre. Un chef ajoute <strong>n’importe quel</strong> membre de
          la confrérie dans un salon. Un membre écrit à qui accepte de le
          recevoir. La seule limite est la <strong>préférence du
          destinataire</strong> — jamais son rattachement.
        </p>
      </Callout>

      <h2 id="qui-peut-quoi">Qui peut quoi</h2>
      <p>
        Le cercle plein signifie oui ; le cercle barré, non ; le trait, « en
        partie » — le geste est possible, mais sur un périmètre réduit.
      </p>

      <Matrix
        columns={["Talibé", "Chef", "Collecteur", "Admin"]}
        rows={[
          {
            label: "Faire un Jëf pour soi",
            cells: [{ value: "yes" }, { value: "yes" }, { value: "yes" }, { value: "yes" }],
          },
          {
            label: "Donner au nom d'une tutelle",
            cells: [
              { value: "yes" },
              { value: "no" },
              { value: "yes" },
              { value: "no" },
            ],
          },
          {
            label: "Encaisser un versement en espèces",
            cells: [
              { value: "no" },
              { value: "yes" },
              { value: "yes" },
              { value: "yes" },
            ],
          },
          {
            label: "Voir des Jëfs au-delà des siens",
            cells: [
              { value: "no" },
              { value: "part", note: "ceux de son Daara" },
              { value: "part", note: "ceux qu'il a encaissés" },
              { value: "yes", note: "tout le réseau" },
            ],
          },
          {
            label: "Lancer un Ndiguel",
            cells: [{ value: "no" }, { value: "no" }, { value: "no" }, { value: "yes" }],
          },
          {
            label: "Suivre les tâches d'un Ndiguel",
            cells: [
              { value: "part", note: "s'il en est l'organisateur" },
              { value: "yes" },
              { value: "part", note: "s'il en est l'organisateur" },
              { value: "yes" },
            ],
          },
          {
            label: "Créer une Fête",
            cells: [{ value: "no" }, { value: "no" }, { value: "no" }, { value: "yes" }],
          },
          {
            label: "Consulter la liste des Talibés",
            cells: [
              { value: "no" },
              { value: "part", note: "ceux de son Daara" },
              { value: "yes" },
              { value: "yes" },
            ],
          },
          {
            label: "Ouvrir un salon de discussion",
            cells: [{ value: "no" }, { value: "yes" }, { value: "no" }, { value: "yes" }],
          },
          {
            label: "Valider un versement ou une pièce",
            cells: [{ value: "no" }, { value: "no" }, { value: "no" }, { value: "yes" }],
          },
          {
            label: "Créer ou modifier un Daara",
            cells: [{ value: "no" }, { value: "no" }, { value: "no" }, { value: "yes" }],
          },
          {
            label: "Lire le journal d'audit",
            cells: [{ value: "no" }, { value: "no" }, { value: "no" }, { value: "yes" }],
          },
        ]}
      />

      <Callout title="Un rôle n'en efface pas un autre">
        <p className="m-0">
          Un collecteur reste un talibé : il fait ses propres Jëfs, qui ne se
          confondent pas avec ce qu’il encaisse pour les autres. Son écran{" "}
          <em>Mes Jëfs et mes collectes</em> montre bien les deux, séparément —
          il n’en montrait qu’un seul jusqu’à ce que la
          distinction soit corrigée.
        </p>
      </Callout>

      <Ornament />

      <h2 id="meme-ecran">Le même écran, deux rôles</h2>
      <p>
        La différence ne se voit pas dans le dessin, mais dans la portée des
        chiffres. Ci-dessous, le tableau de bord tel que le voit
        l’administration, puis tel que le voit un chef de Daara.
      </p>

      <Shot
        src="/guide-assets/shots/dashboard.webp"
        alt="Tableau de bord d'un administrateur : montants et effectifs de l'ensemble du réseau."
        caption={
          <>
            <b>Vue administrateur.</b> « Tous Daaras confondus » — le sous-titre
            annonce la portée.
          </>
        }
      />

      <Shot
        src="/guide-assets/shots/chef-dashboard.webp"
        alt="Tableau de bord d'un chef de Daara : les mêmes indicateurs, bornés à son Daara."
        caption={
          <>
            <b>Vue chef de Daara.</b> Mêmes indicateurs, même disposition — mais
            les chiffres ne parlent que de son Daara, et le rail a perdu la
            section Administration.
          </>
        }
      />

      <h2 id="changer-de-role">Qui attribue les rôles</h2>
      <p>
        L’administration, depuis <em>Utilisateurs et rôles</em>. Un chef de
        Daara peut proposer un membre comme collecteur, mais c’est
        l’administrateur qui nomme. Un membre ne peut pas changer son
        propre rôle, ni son Daara — ce dernier relève lui aussi de
        l’administration, pour éviter qu’un rattachement ne change
        après coup sous des dons déjà enregistrés.
      </p>
      <p>
        Le <Link href="/guide/profil-documents">titre</Link>, lui, se demande :
        c’est la seule distinction que le membre sollicite lui-même.
      </p>
    </>
  );
}
