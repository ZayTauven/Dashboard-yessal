/*
 * Résolution tardive des icônes du sommaire.
 *
 * Le manifeste ne porte que des CHAÎNES. C'est la seule façon d'avoir un
 * sommaire lisible à la fois par un composant serveur (la page d'un chapitre)
 * et par un composant client (le rail, la palette de recherche) : une fonction
 * ne franchit pas la frontière RSC, et une icône Lucide passée en propriété
 * fait tomber la page entière — pas le composant, la page.
 *
 * La table vit donc ici, et chaque côté résout chez lui.
 */

import {
  Book,
  Compass,
  HandCoins,
  Heart,
  HeartHandshake,
  IdCard,
  KeyRound,
  Landmark,
  Shield,
  Smartphone,
  Sparkles,
  Users,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  key: KeyRound,
  compass: Compass,
  book: Book,
  users: Users,
  heart: Heart,
  "hand-coins": HandCoins,
  landmark: Landmark,
  "users-round": UsersRound,
  "heart-handshake": HeartHandshake,
  "id-card": IdCard,
  smartphone: Smartphone,
  shield: Shield,
};

export function GuideIcon({
  name,
  size = 18,
  className,
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICONS[name] ?? Book;
  return <Icon size={size} className={className} aria-hidden="true" />;
}
