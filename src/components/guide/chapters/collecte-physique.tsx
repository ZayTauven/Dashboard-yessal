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

export default function CollectePhysique() {
  return (
    <>
      <p>
        Le poste du <Terme mot="collecteur" />. Il est debout, souvent sur
        téléphone, face à quelqu’un qui lui tend de l’argent. La
        tâche est strictement linéaire : <strong>identifier la personne</strong>,
        puis <strong>enregistrer le versement</strong>. L’écran est
        numéroté pour cette raison — on doit voir d’un coup d’œil où
        l’on en est, y compris en pleine rue.
      </p>

      <Callout tone="rule" title="Un collecteur collecte partout">
        <p className="m-0">
          Pas seulement dans son <Terme mot="daara" />. La personne en face peut
          appartenir à n’importe quel Daara de la confrérie : la recherche
          couvre tout le réseau, et l’enregistrement est valide.
        </p>
      </Callout>

      <Shot
        src="/guide-assets/shots/collecte.webp"
        alt="L'écran de collecte physique : deux panneaux numérotés, « 1 · Identifier le membre » et « 2 · Enregistrer le versement », le second en attente."
        url="yessal.sn/dashboard/collect"
        caption={
          <>
            <b>Les deux panneaux.</b> Le second reste en attente tant que
            personne n’est choisi — et il le dit, au lieu de rester
            simplement grisé.
          </>
        }
        priority
      />

      <h2 id="etape-1">1 · Identifier le membre</h2>

      <Steps>
        <Step title="Chercher">
          <p>
            Nom, prénom, Daara ou téléphone : le champ accepte les quatre. Deux
            caractères suffisent à lancer la recherche.
          </p>
        </Step>

        <Step title="Départager les homonymes">
          <p>
            Deux <em>Amadou Ndiaye</em> dans la liste, cela arrive tous les
            jours. Chaque résultat affiche donc le Daara, le titre éventuel et
            la fin du numéro de téléphone. Demandez les quatre derniers
            chiffres : c’est le départage le plus rapide, et le plus
            sûr.
          </p>
        </Step>

        <Step title="Si la personne n'est pas dans la liste">
          <p>
            <Ui>Inscrire ce membre</Ui> ouvre une inscription rapide : prénom,
            nom, téléphone, et l’adresse e-mail si elle en a une. Le compte
            est créé immédiatement — on n’attend pas une validation pour
            encaisser.
          </p>
        </Step>
      </Steps>

      <Shot
        src="/guide-assets/shots/collecte-recherche.webp"
        alt="La recherche de membre a rendu plusieurs résultats, chacun avec son avatar, son Daara et la fin de son numéro."
        url="yessal.sn/dashboard/collect"
        caption={
          <>
            <b>Les résultats.</b> Le Daara et la fin du numéro suivent chaque
            nom : ce sont eux qui distinguent deux homonymes.
          </>
        }
      />

      <Callout tone="warn" title="Le mot de passe provisoire">
        <p>
          Une inscription rapide génère un mot de passe provisoire, affiché une
          seule fois dans une fenêtre. Transmettez-le à la personne — dictez-le,
          ou recopiez-le dans un message — puis confirmez avec{" "}
          <Ui>J’ai transmis le mot de passe</Ui>.
        </p>
        <p className="m-0">
          Il ne sera <strong>plus jamais affiché</strong>. S’il se perd, la
          personne devra passer par <Ui>Oublié ?</Ui> sur l’écran de
          connexion.
        </p>
      </Callout>

      <Ornament />

      <h2 id="etape-2">2 · Enregistrer le versement</h2>
      <p>Quatre champs, dans cet ordre.</p>

      <h3>Méthode de versement</h3>
      <p>
        Attention au sens de ce champ : il ne dit pas comment le donateur a
        payé — il a payé en espèces, sinon vous ne seriez pas là. Il dit{" "}
        <strong>ce que vous faites de cet argent</strong> pour qu’il
        rejoigne le compte Yessal.
      </p>
      <ul>
        <li>
          <strong>Conserver en espèces</strong> — l’argent reste entre vos
          mains pour l’instant.
        </li>
        <li>
          <strong>Dépôt Wave</strong> ou <strong>Dépôt Orange Money</strong> —
          vous reversez par mobile money.
        </li>
        <li>
          <strong>Dépôt carte bancaire</strong> — vous reversez par carte.
        </li>
        <li>
          <strong>Virement bancaire</strong> — faites le virement d’abord,
          puis saisissez sa <strong>référence</strong> dans le champ qui
          apparaît. Sans elle, le rapprochement est impossible.
        </li>
      </ul>

      <h3>Attribuer au Ndiguel</h3>
      <p>
        La liste ne propose que les <Terme mot="ndiguel">Ndiguels</Terme> en
        cours. Si elle est vide, aucune collecte ne peut être rattachée — et
        l’écran le dit franchement plutôt que de laisser le bouton
        inactif sans explication. Il faut alors attendre qu’un Ndiguel soit
        ouvert par l’administration.
      </p>

      <h3>Somme récoltée</h3>
      <p>
        En francs CFA, minimum <Amount>1 000 FCFA</Amount>. Relisez le montant à
        voix haute devant la personne avant de valider : c’est le seul
        contrôle qui existe, et le seul qui compte.
      </p>

      <h3>Enregistrer</h3>
      <p>
        <Ui>Enregistrer le Jëf</Ui> clôt l’opération. Le{" "}
        <Terme mot="jef" /> part en statut <em>en attente</em> : un
        administrateur le confirmera, en principe sous vingt-quatre heures. Le
        donateur reçoit une notification.
      </p>

      <Callout title="Pourquoi une validation ?">
        <p className="m-0">
          Parce qu’entre la main qui donne et le compte qui reçoit, il y a
          une personne. La validation n’est pas une défiance envers le
          collecteur : c’est ce qui permet, en cas d’écart, de dire{" "}
          <em>où</em> l’écart s’est produit, et donc de le régler
          entre gens qui se connaissent.
        </p>
      </Callout>

      <h2 id="ses-propres-jefs">Ses collectes et ses propres Jëfs</h2>
      <p>
        Un collecteur reste un talibé. Son écran <Ui>Mes Jëfs et mes
        collectes</Ui> montre les deux, distinctement : ce qu’il a donné
        lui-même, et ce qu’il a encaissé pour les autres. Ne confondez pas
        les deux colonnes au moment de rendre des comptes.
      </p>

      <h2 id="avant-de-sortir">Avant de partir sur le terrain</h2>
      <Checklist
        items={[
          "Vérifier qu'au moins un Ndiguel est en cours — sinon rien ne peut être enregistré.",
          "Connaître le raccourci Ctrl + K puis « col » : il ramène à cet écran en deux touches.",
          "Prévoir de quoi noter un mot de passe provisoire, si vous inscrivez quelqu'un.",
          "Se souvenir que la « méthode de versement » parle de VOUS, pas du donateur.",
        ]}
      />
    </>
  );
}
