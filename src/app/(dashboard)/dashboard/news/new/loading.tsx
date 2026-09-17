/*
 * Écran d'attente de la route — affiché par Next pendant que le composant
 * serveur résout le rôle de session.
 */
import { FormSkeleton } from "@/components/vireo/Skeletons";

export default function Loading() {
  return <FormSkeleton />;
}
