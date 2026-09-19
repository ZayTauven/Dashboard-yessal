"use client";

/*
 * Sommaire de page — les titres de niveau 2 du chapitre, avec suivi du
 * défilement.
 *
 * Il LIT le document plutôt que de recevoir une liste : un chapitre est du JSX
 * écrit à la main, et tenir à jour une seconde liste de ses titres à côté
 * garantit qu'elle finira fausse. Les ancres, elles, servent déjà aux liens
 * profonds — on s'appuie dessus.
 *
 * Le suivi passe par IntersectionObserver plutôt que par un écouteur de
 * scroll : pas de calcul à chaque pixel, et le navigateur fait le travail.
 */

import { useEffect, useState } from "react";

interface Heading {
  id: string;
  text: string;
}

export function GuideToc() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLHeadingElement>(".yg-main h2[id]"),
    );
    setHeadings(nodes.map((n) => ({ id: n.id, text: n.textContent || "" })));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        /* Plusieurs titres peuvent être visibles : on retient le plus haut
           d'entre eux, c'est celui qu'on est en train de lire. */
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      {
        /* La fenêtre d'observation s'arrête aux deux tiers hauts de l'écran :
           un titre qui vient d'entrer par le bas n'est pas encore lu. */
        rootMargin: "-80px 0px -60% 0px",
        threshold: 0,
      },
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  if (headings.length < 2) return <div className="yg-toc" aria-hidden="true" />;

  return (
    <nav className="yg-toc" aria-label="Sur cette page">
      <p className="yg-toc__title">Sur cette page</p>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={`yg-toc__link${active === h.id ? " is-active" : ""}`}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
}
