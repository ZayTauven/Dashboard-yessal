import Link from "next/link";
import { Terme } from "../Terme";
import { Callout, Ornament, Shot, Ui } from "../primitives";

export default function SuivreSonDaara() {
  return (
    <>
      <p>
        Le <Terme mot="daara" /> est le groupe auquel on appartient. Un membre
        n’en a qu’un, et ce rattachement ne dépend pas de
        l’endroit où il vit : les membres d’un même Daara peuvent
        être à Touba, à Dakar, à Milan ou à New York.
      </p>

      <h2 id="mon-daara">Mon Daara</h2>
      <p>
        <Ui>Mon Daara</Ui>, dans la section Communauté du rail. La page tient en
        trois blocs : l’identité du Daara, les personnes qui l’animent,
        et l’annuaire des membres.
      </p>

      <Shot
        src="/guide-assets/shots/chef-daara.webp"
        alt="La page Mon Daara : nom du Daara et sa zone territoriale, le chef, les collecteurs désignés, et la liste des autres membres."
        url="yessal.sn/dashboard/daara"
        caption={
          <>
            <b>Mon Daara.</b> Sous le nom, la <b>zone territoriale</b> et son
            code — ici <i>ARMEE &amp; DIAKHAO SINE DIEUZBOU (DS S18)</i>. La
            pastille verte dit que le Daara est actif.
          </>
        }
        priority
      />

      <ul>
        <li>
          <strong>L’identité</strong> — le nom, la{" "}
          <Terme mot="zone">zone territoriale</Terme> de rattachement, la
          description, et le fait que le Daara soit actif ou non. Un Daara
          désactivé n’accepte plus de nouveaux membres.
        </li>
        <li>
          <strong>Le chef de Daara</strong> — son nom et l’effectif inscrit
          sur la plateforme.
        </li>
        <li>
          <strong>Les collecteurs</strong> — ceux qui ont été désignés. La carte
          peut annoncer qu’il n’y en a aucun : ce n’est pas une
          erreur, tous les Daaras n’en ont pas.
        </li>
        <li>
          <strong>L’annuaire</strong> — les autres membres, dépliable.
        </li>
      </ul>

      <Callout title="« Effectif sur la plateforme »">
        <p className="m-0">
          Ce chiffre compte les membres <strong>inscrits</strong>, pas les
          membres du Daara. Un Daara nombreux dont peu de talibés ont ouvert un
          compte affichera un petit nombre. L’écart n’est pas une
          anomalie : il mesure ce qui reste à faire.
        </p>
      </Callout>

      <Ornament />

      <h2 id="chef-de-daara">Ce que voit un chef de Daara</h2>
      <p>
        Le chef dispose de trois écrans que les autres membres n’ont pas,
        tous bornés à son Daara.
      </p>

      <ul>
        <li>
          <strong>Talibés du Daara</strong> — la liste complète, avec les
          fiches : identité, contacts, documents, historique des{" "}
          <Terme mot="jef">Jëfs</Terme>.
        </li>
        <li>
          <strong>Jëfs du Daara</strong> — tous les dons de ses membres, et pas
          seulement les siens.
        </li>
        <li>
          <strong>Un tableau de bord borné</strong> — les mêmes indicateurs que
          l’administration, calculés sur son seul périmètre.
        </li>
      </ul>

      <Shot
        src="/guide-assets/shots/chef-membres.webp"
        alt="La liste des Talibés du Daara, vue par le chef : une ligne par membre avec son avatar, son titre et ses contacts."
        url="yessal.sn/dashboard/members"
        caption={
          <>
            <b>Talibés du Daara.</b> Un administrateur voit le même écran sous
            le nom <b>Liste des Talibés</b>, sans la borne du Daara. Le libellé
            change parce que la portée change.
          </>
        }
      />

      <h2 id="collecteurs">Proposer un collecteur</h2>
      <p>
        Un chef de Daara connaît les siens mieux que l’administration. Il
        peut donc <strong>proposer</strong> un membre comme{" "}
        <Terme mot="collecteur" /> — mais c’est un administrateur qui
        nomme, depuis <Ui>Utilisateurs et rôles</Ui>.
      </p>
      <p>
        Une fois nommé, ce collecteur n’est pas enfermé dans le Daara : il
        encaissera auprès de n’importe quel membre de la confrérie. Voir{" "}
        <Link href="/guide/roles">Qui fait quoi</Link>.
      </p>

      <h2 id="zones">Daara et zone territoriale</h2>
      <p>
        Les Daaras sont regroupés en <Terme mot="zone">zones
        territoriales</Terme>, identifiées par un code et un nom. La zone sert à
        l’organisation et aux statistiques ; elle ne restreint jamais qui
        peut donner, écrire ou collecter.
      </p>

      <Callout tone="warn" title="Un code de zone ne suffit pas à l'identifier">
        <p className="m-0">
          Plusieurs zones partagent le même code — <em>DS S3</em> en couvre
          trois à lui seul. C’est le couple <strong>code + nom</strong> qui
          désigne une zone. Cette subtilité a déjà coûté cher : un import
          résolvant sur le seul code avait fondu des zones entre elles et
          reclassé des dizaines de Daaras sous la mauvaise.
        </p>
      </Callout>

      <h2 id="changer-de-daara">Changer de Daara</h2>
      <p>
        Seul un administrateur peut modifier le rattachement d’un membre.
        Ce n’est pas une rigidité administrative : des dons déjà
        enregistrés pointent vers un Daara, et déplacer quelqu’un
        après coup déplace aussi ce qu’il a donné. La demande passe donc
        par le chef de Daara, qui la porte à l’administration.
      </p>
    </>
  );
}
