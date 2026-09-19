import Link from "next/link";
import { Terme } from "../Terme";
import { Callout, Ornament, Shot, Step, Steps, Ui } from "../primitives";

export default function Tutelles() {
  return (
    <>
      <p>
        On donne rarement pour soi seul. On donne pour sa mère, pour un enfant,
        pour quelqu’un qui n’est plus là. Jusqu’ici cela se
        disait de vive voix et se perdait avec la voix. La{" "}
        <Terme mot="tutelle" /> est ce qui permet d’inscrire ce nom à côté
        du don.
      </p>

      <Callout tone="rule" title="Ce que la tutelle change, et ce qu'elle ne change pas">
        <p className="m-0">
          Le <Terme mot="jef" /> reste <strong>versé par vous</strong> : il
          sort de votre compte, il figure dans vos Jëfs, c’est vous qui
          payez. Ce que la tutelle ajoute, c’est le nom du{" "}
          <strong>bénéficiaire</strong>, inscrit avec le don et conservé avec
          lui.
        </p>
      </Callout>

      <h2 id="enregistrer">Enregistrer un proche</h2>
      <p>
        <Ui>Tutelles</Ui> dans la section Communauté du rail. Au premier
        passage, l’écran est vide et propose la seule chose utile :{" "}
        <Ui>Ajouter un proche</Ui>.
      </p>

      <Shot
        src="/guide-assets/shots/membre-tutelles.webp"
        alt="L'écran « Mes tutelles » vide, avec le message « Aucun proche enregistré » et le bouton Ajouter un proche."
        url="yessal.sn/dashboard/tutelles"
        caption={
          <>
            <b>Mes tutelles.</b> « Les proches dont vous prenez en charge les
            participations et les Jëfs » — la phrase du sous-titre dit
            exactement ce qu’est une tutelle ici.
          </>
        }
        priority
      />

      <Steps>
        <Step title="Prénom et nom">
          <p>
            Ceux du bénéficiaire, tels qu’on les emploie dans la
            communauté. C’est ce nom qui apparaîtra à côté des dons.
          </p>
        </Step>

        <Step title="Le lien de parenté">
          <p>
            Fils, fille, mère, père, épouse, oncle… Le champ est libre :
            écrivez le lien tel qu’il se dit chez vous. Il sert à vous
            retrouver dans votre propre liste, pas à alimenter une statistique.
          </p>
        </Step>

        <Step title="Associer un compte, si la personne en a un">
          <p>
            Facultatif, mais c’est ce qui donne tout son sens à la tutelle.
            Si le bénéficiaire possède un compte, les Jëfs faits en son nom
            apparaissent <strong>dans son propre historique</strong> : il voit
            ce qui a été donné pour lui, sans avoir à le demander.
          </p>
        </Step>
      </Steps>

      <Ornament />

      <h2 id="donner-au-nom">Faire un Jëf au nom d’un proche</h2>
      <p>
        Une fois la tutelle enregistrée, elle devient disponible au moment du
        don : on choisit le bénéficiaire, puis le montant et le moyen de
        paiement comme pour n’importe quel{" "}
        <Link href="/guide/faire-un-jef">Jëf</Link>.
      </p>
      <p>
        La confirmation nomme les deux personnes :{" "}
        <em>« Don de 10 000 FCFA enregistré au nom de Sokhna Mbaye. »</em> Le
        reçu, l’historique et les listes portent la même mention.
      </p>

      <h2 id="compte-de-tutelle">Le compte de tutelle</h2>
      <p>
        Une personne au nom de laquelle on donne peut avoir son propre compte —
        avec le rôle <strong>Tutelle</strong>. C’est un compte de{" "}
        <strong>consultation</strong> : il montre les dons reçus, et rien
        d’autre. Ni collecte, ni gestion, ni annuaire.
      </p>

      <Callout title="À qui cela sert">
        <p className="m-0">
          À un parent âgé pour qui ses enfants cotisent, et qui veut pouvoir
          regarder lui-même plutôt que demander. À une personne éloignée dont la
          famille prend en charge la participation. Le compte n’est jamais
          obligatoire : une tutelle sans compte fonctionne exactement pareil,
          simplement la personne ne voit rien de son côté.
        </p>
      </Callout>

      <h2 id="qui-peut">Qui peut enregistrer des tutelles</h2>
      <p>
        Les talibés et les collecteurs. Le geste appartient à celui qui donne :
        c’est lui qui sait pour qui il donne, et nul ne peut le décider à
        sa place.
      </p>

      <Callout tone="warn" title="Une tutelle n'est pas une procuration">
        <p className="m-0">
          Enregistrer quelqu’un comme tutelle ne donne aucun droit sur son
          compte, ne permet pas d’agir en son nom ailleurs, et ne modifie
          pas son rattachement à son Daara. Cela ne fait qu’une chose :
          attacher son nom aux dons que vous faites pour lui.
        </p>
      </Callout>
    </>
  );
}
