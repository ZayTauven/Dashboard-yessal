"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Yessal Guide — la recherche
 * ═══════════════════════════════════════════════════════════════════════════
 * Treize chapitres et dix entrées de lexique : trop peu pour un moteur, trop
 * pour un sommaire qu'on parcourt à l'œil quand on cherche un mot précis.
 *
 * Le champ cherche dans les DEUX : « ndiguel » remonte le chapitre qui explique
 * comment en lancer un ET la définition du mot. C'est souvent la définition
 * qu'on voulait.
 *
 * cmdk est déjà une dépendance (la palette ⌘K du dashboard) — on réutilise la
 * même mécanique et les mêmes touches, pour que le geste soit le même des deux
 * côtés de la plateforme.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { BookOpen, Search } from "lucide-react";
import { GUIDE_CHAPTERS, GUIDE_SECTIONS } from "@/lib/guide/manifest";
import { LEXIQUE } from "@/lib/guide/lexique";
import { GuideIcon } from "./GuideIcon";

export function GuideSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  /* ⌘K / Ctrl+K partout dans le guide. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Rechercher dans le guide"
      className="yg-pal"
    >
      <div className="yg-pal__panel">
        <div className="yg-pal__search">
          <Search size={17} aria-hidden="true" />
          <Command.Input
            className="yg-pal__input"
            placeholder="Un chapitre, un mot du lexique…"
            value={query}
            onValueChange={setQuery}
            autoFocus
          />
          <kbd className="yg-kbd">Échap</kbd>
        </div>

        <Command.List className="yg-pal__list">
          <Command.Empty className="yg-pal__empty">
            Rien sous ce mot. Essayez « jëf », « collecte » ou « mot de passe ».
          </Command.Empty>

          {GUIDE_SECTIONS.map((section) => {
            const items = GUIDE_CHAPTERS.filter((c) => c.section === section.id);
            return (
              <Command.Group key={section.id} heading={section.label}>
                {items.map((chapter) => (
                  <Command.Item
                    key={chapter.slug}
                    className="yg-pal__item"
                    /* cmdk filtre sur `value` : on y verse les mots-clés pour
                       que « don » trouve « Faire un Jëf ». */
                    value={`${chapter.title} ${chapter.lead} ${(chapter.keywords || []).join(" ")}`}
                    onSelect={() => go(`/guide/${chapter.slug}`)}
                  >
                    <GuideIcon name={chapter.icon} size={16} />
                    <span>{chapter.title}</span>
                    <span className="yg-pal__hint">{chapter.minutes} min</span>
                  </Command.Item>
                ))}
              </Command.Group>
            );
          })}

          <Command.Group heading="Lexique">
            {LEXIQUE.map((term) => (
              <Command.Item
                key={term.id}
                className="yg-pal__item"
                value={`${term.word} ${term.short}`}
                onSelect={() => go(`/guide/lexique#${term.id}`)}
              >
                <BookOpen size={16} aria-hidden="true" />
                <span>{term.word}</span>
                <span className="yg-pal__hint">définition</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </div>
    </Command.Dialog>
  );
}
