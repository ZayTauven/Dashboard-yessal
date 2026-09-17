/*
 * Écran d'attente de la route — affiché pendant que le composant serveur
 * récupère l'article à modifier.
 */
import { FormSkeleton } from "@/components/vireo/Skeletons";

export default function Loading() {
  return <FormSkeleton />;
}
