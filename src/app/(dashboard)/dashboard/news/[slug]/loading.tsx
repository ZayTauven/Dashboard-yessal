/*
 * Écran d'attente de la route — affiché par Next pendant que le composant
 * serveur résout ses appels API. Sans lui, la navigation reste figée sur la
 * page précédente et l'utilisateur reclique.
 */
import { DetailSkeleton } from "@/components/vireo/Skeletons";

export default function Loading() {
  return <DetailSkeleton />;
}
