"use client";

import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Image de couverture, avec repli sur l'icône
 * ═══════════════════════════════════════════════════════════════════════════
 * Les trois écrans qui affichent une bannière — actualité, détail d'actualité,
 * Ndiguel — prévoyaient déjà un joli repli : une icône centrée sur fond neutre
 * quand le champ est vide.
 *
 *     {post.cover_image ? <img src={post.cover_image} … /> : <Newspaper … />}
 *
 * Mais ce repli ne couvre que le cas « aucune image enregistrée ». Il ne
 * couvre pas « une image est enregistrée, et le fichier a disparu » — la base
 * conserve alors un chemin, la condition est vraie, la balise est rendue, et
 * le navigateur affiche sa vignette cassée. C'est le pire des deux mondes :
 * l'écran a un joli état vide, et il ne s'en sert pas.
 *
 * Un fichier peut manquer pour bien des raisons : conteneur recréé sans volume
 * persistant, disque éphémère d'un hébergeur, migration vers un stockage
 * objet, suppression manuelle. Aucune n'a à être visible par le membre.
 *
 * <Avatar> traitait déjà le cas par `onError`. Ce composant applique la même
 * règle aux bannières : une image qui ne charge pas est traitée exactement
 * comme une image absente.
 */

interface CoverImageProps {
  src?: string | null;
  alt?: string;
  /**
   * Icône affichée en l'absence d'image — ou quand elle ne charge pas.
   *
   * OPTIONNELLE, et c'est ce qui rend le composant utilisable depuis un
   * composant SERVEUR. Une icône Lucide est une fonction : React refuse de la
   * sérialiser à travers la frontière serveur → client, et l'échec n'est pas
   * discret — la page entière part en erreur :
   *
   *   Functions cannot be passed directly to Client Components
   *   <... src=... icon={{$$typeof: ..., render: function Image}} ...>
   *
   * C'est ce qui rendait la page de lecture d'un article inaccessible : elle
   * est le seul appelant serveur du produit, tous les autres sont des
   * composants client, où passer l'icône ne pose aucun problème.
   *
   * Un serveur omet donc `icon` et hérite du repli ci-dessous ; un client
   * garde le choix.
   */
  icon?: LucideIcon;
  iconSize?: number;
  /** Classes de la balise <img>. */
  className?: string;
  /** Classes du bloc de repli, généralement les mêmes dimensions. */
  fallbackClassName?: string;
}

export function CoverImage({
  src,
  alt = "",
  icon: Icon = ImageIcon,
  iconSize = 56,
  className,
  fallbackClassName,
}: CoverImageProps) {
  const [broken, setBroken] = useState(false);

  if (src && !broken) {
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <div className={cn("ax-center bg-muted", fallbackClassName ?? className)}>
      <Icon size={iconSize} className="ax-text-subtle" aria-hidden="true" />
    </div>
  );
}
