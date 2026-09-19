"use client";

/*
 * Questions fréquentes — un accordéon, une seule ouverte à la fois.
 *
 * Écrit à la main plutôt que sur `<details>` : il fallait pouvoir refermer la
 * précédente en ouvrant la suivante, ce que le couple details/summary ne fait
 * qu'avec l'attribut `name`, encore inégalement pris en charge.
 */

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

export interface FaqEntry {
  q: string;
  a: ReactNode;
}

export function Faq({ entries }: { entries: FaqEntry[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="yg-faq">
      {entries.map((entry, i) => {
        const isOpen = open === i;
        return (
          <div key={entry.q} className="yg-faq__item">
            <button
              type="button"
              className="yg-faq__q"
              aria-expanded={isOpen}
              aria-controls={`faq-${i}`}
              onClick={() => setOpen(isOpen ? null : i)}
            >
              {entry.q}
              <ChevronDown className="yg-faq__chev" size={17} aria-hidden="true" />
            </button>
            {isOpen && (
              <div id={`faq-${i}`} className="yg-faq__a">
                {entry.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
