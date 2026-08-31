/*
 * Fond ambiant Aurora — trois halos radiaux fixes derrière toute l'application.
 *
 * C'est la réponse la plus directe au « côté monochrome » relevé sur les
 * visuels web : au lieu d'un aplat uni, le canvas reçoit un dégradé très doux
 * (ambre chaud en haut à gauche, indigo en bas à droite, accent au centre
 * droit) qui donne de la profondeur aux cartes de verre posées dessus.
 *
 * Les couleurs viennent des jetons --ax-glow-1/2/3 : elles s'assombrissent
 * seules en mode sombre et le troisième halo suit l'accent choisi dans le
 * panneau Apparence. La couche est en z-index 0, purement décorative, et
 * ignorée du pointeur comme des lecteurs d'écran.
 */
export function AmbientBackdrop() {
  return (
    <div className="ax-ambient" aria-hidden="true">
      <i />
    </div>
  );
}

export default AmbientBackdrop;
