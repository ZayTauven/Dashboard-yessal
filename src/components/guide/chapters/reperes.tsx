import { Terme } from "../Terme";
import { Callout, Kbd, Ornament, Shot, Ui } from "../primitives";

export default function Reperes() {
  return (
    <>
      <p>
        L’écran se lit en trois zones, et elles ne bougent jamais : le rail
        à gauche dit <em>où l’on peut aller</em>, la barre du haut{" "}
        <em>ce qu’on peut faire tout de suite</em>, le centre{" "}
        <em>où l’on est</em>. Quatre minutes ici épargnent beaucoup de
        clics ensuite.
      </p>

      <Shot
        src="/guide-assets/shots/dashboard.webp"
        alt="Vue d'ensemble du dashboard : rail de navigation à gauche, barre supérieure, et contenu au centre."
        caption={
          <>
            <b>Les trois zones.</b> Le rail, la barre, le contenu. Le rail
            n’affiche que ce à quoi votre rôle donne accès : deux personnes
            n’y voient pas le même nombre d’entrées.
          </>
        }
        priority
      />

      <h2 id="le-rail">Le rail de navigation</h2>
      <p>
        Les entrées sont groupées en quatre familles, toujours dans le même
        ordre :
      </p>
      <ul>
        <li>
          <strong>Application</strong> — le tableau de bord, les actualités, les
          notifications.
        </li>
        <li>
          <strong>Gestion</strong> — les Fêtes, les{" "}
          <Terme mot="ndiguel">Ndiguels</Terme>, la collecte physique, les{" "}
          <Terme mot="jef">Jëfs</Terme>.
        </li>
        <li>
          <strong>Communauté</strong> — votre <Terme mot="daara" />, la
          messagerie, les <Terme mot="talibe">Talibés</Terme>, les{" "}
          <Terme mot="tutelle">tutelles</Terme>.
        </li>
        <li>
          <strong>Administration</strong> — visible uniquement par
          l’administration.
        </li>
      </ul>

      <Callout tone="tip" title="Le filtre du menu">
        <p className="m-0">
          Le champ <Ui>Filtrer le menu…</Ui>, tout en haut du rail, cherche
          aussi dans des mots qui ne sont pas écrits à l’écran : taper{" "}
          <em>don</em> fait remonter <Ui>Les Jëfs</Ui>, <em>campagne</em> fait
          remonter <Ui>Les Ndiguels</Ui>. Utile quand on connaît la chose sans
          connaître son nom ici.
        </p>
      </Callout>

      <p>
        Le libellé de certaines entrées change selon votre rôle, et ce
        n’est pas un caprice : il dit <em>à qui appartiennent les
        données</em>. Un administrateur lit <Ui>Les Jëfs</Ui> — tous. Un chef
        de Daara lit <Ui>Jëfs du Daara</Ui>. Un talibé lit <Ui>Mes Jëfs</Ui>.
      </p>

      <Ornament />

      <h2 id="la-barre">La barre supérieure</h2>
      <p>De gauche à droite, six commandes :</p>
      <ul>
        <li>
          <strong>Le bouton de repli</strong> — réduit le rail à ses icônes, et
          rend de la place au contenu.
        </li>
        <li>
          <strong>La recherche d’actions</strong> — la vraie porte
          d’entrée, décrite juste en dessous.
        </li>
        <li>
          <strong>La grille d’applications</strong> — les raccourcis vers
          les écrans les plus fréquents.
        </li>
        <li>
          <strong>La cloche</strong> — les notifications non lues, avec un
          aperçu des dernières.
        </li>
        <li>
          <strong>Le soleil ou la lune</strong> — bascule clair / sombre.
        </li>
        <li>
          <strong>La palette</strong> — ouvre <Ui>Apparence</Ui> : couleur
          d’accent, densité, habillage du rail. Ces réglages ne concernent
          que votre navigateur.
        </li>
        <li>
          <strong>Votre avatar</strong> — <Ui>Mon profil</Ui>,{" "}
          <Ui>Apparence</Ui> et <Ui>Se déconnecter</Ui>.
        </li>
      </ul>

      <h2 id="la-palette">La palette d’actions</h2>
      <p>
        <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> — ou <Kbd>⌘</Kbd> <Kbd>K</Kbd> sur Mac —
        ouvre une fenêtre de recherche par-dessus l’écran. C’est le
        geste qui remplace tous les autres : on tape trois lettres, on appuie
        sur Entrée.
      </p>

      <Shot
        src="/guide-assets/shots/palette.webp"
        alt="La palette d'actions rapides ouverte par-dessus le tableau de bord, avec ses groupes Actions, Navigation et Apparence."
        caption={
          <>
            <b>La palette.</b> Trois familles, dans l’ordre de
            l’urgence réelle : ce qu’on vient <b>faire</b>, où
            l’on veut <b>aller</b>, puis l’apparence. Elle ne propose
            que ce que votre rôle autorise.
          </>
        }
      />

      <Callout title="Pour un collecteur, ce raccourci change la journée">
        <p className="m-0">
          Vingt versements enregistrés dans l’après-midi, c’est vingt
          allers-retours entre deux écrans. <Kbd>Ctrl</Kbd> <Kbd>K</Kbd> puis{" "}
          <em>col</em> ramène le trajet à deux touches.
        </p>
      </Callout>

      <h2 id="le-contenu">Le contenu</h2>
      <p>
        Chaque page s’ouvre de la même façon : un fil d’Ariane, un
        titre, une phrase qui dit ce que la page contient, et à droite les
        actions qui s’y rapportent. Les listes ont leurs filtres juste
        au-dessus, sous forme d’onglets comptés — <Ui>En cours 3</Ui>,{" "}
        <Ui>Terminés 1</Ui> — qui annoncent le nombre avant qu’on clique.
      </p>

      <h2 id="sur-telephone">Sur téléphone</h2>
      <p>
        Le rail disparaît et se rappelle par le bouton à trois barres, en haut à
        gauche. Tout le reste tient sa place. Pour un usage quotidien depuis un
        téléphone, l’application mobile reste plus confortable — voir{" "}
        <Terme mot="jef">le chapitre qui lui est consacré</Terme>.
      </p>

      <h2 id="clair-sombre">Clair, sombre, et la couleur</h2>
      <p>
        Les deux thèmes sont complets : rien n’est illisible dans
        l’un ou l’autre. Par défaut la plateforme suit le réglage de
        votre système.
      </p>

      <Shot
        src="/guide-assets/shots/ndiguels-sombre.webp"
        alt="La liste des Ndiguels en mode sombre : mêmes cartes, mêmes informations, fond profond."
        caption={
          <>
            <b>Le mode sombre.</b> Mêmes écrans, même disposition. Les montants
            restent en vert, quel que soit le thème et quelle que soit la
            couleur d’accent choisie — c’est une règle de la
            plateforme, pas un hasard.
          </>
        }
      />
    </>
  );
}
