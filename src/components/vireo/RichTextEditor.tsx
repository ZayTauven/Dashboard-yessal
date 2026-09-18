"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Éditeur de texte riche
 * ═══════════════════════════════════════════════════════════════════════════
 * Le corps d'un article s'écrivait dans un `<textarea rows={8}>`. Rien ne
 * permettait un intertitre, une liste ou un lien — et la lecture, sur les deux
 * plateformes, se faisait en `whitespace-pre-wrap`, c'est-à-dire en bloc de
 * texte continu. Pour le journal d'une confrérie, qui raconte des Magals, des
 * visites et des collectes, c'est peu.
 *
 * ── Ce qui vient de Vireo, ce qui n'en vient pas ──────────────────────────
 * Le patron `forms/editor` fournit l'HABILLAGE : disposition de la barre
 * d'outils, jetons de surface, séparateurs, pied de statut. On le reprend tel
 * quel — c'est ce qui fait que l'éditeur ressemble au reste du produit.
 *
 * Il ne fournit AUCUN moteur. Dans `Editor.tsx`, les boutons basculent un
 * `useState` (`active[b.k] = !active[b.k]`) qui ne formate rien, et le corps
 * est un `contentEditable` rempli de texte de démonstration en dur. La partie
 * qui édite réellement est écrite ici.
 *
 * ── Pourquoi `execCommand` ────────────────────────────────────────────────
 * L'API est marquée obsolète et ne sera jamais retirée : aucun navigateur ne
 * peut casser les quinze ans d'éditeurs qui en dépendent, et le standard qui
 * devait la remplacer n'a jamais couvert le formatage. Les alternatives
 * réelles sont des moteurs de document complets — ProseMirror, Lexical — qui
 * pèsent plus de 100 Ko pour, ici, six boutons.
 *
 * La dette est donc assumée et bornée : toute la surface obsolète tient dans
 * `exec()`. La remplacer par un moteur ne toucherait que cette fonction.
 *
 * ── Le contrat de formulaire ──────────────────────────────────────────────
 * Un `contentEditable` n'est pas un champ : il ne porte pas de `name` et
 * n'entre dans aucun `FormData`. Le composant tient donc un `<input
 * type="hidden">` à jour, ce qui lui permet de vivre dans un
 * `<form action={serverAction}>` comme n'importe quel `<input>` — sans que la
 * page appelante ait à câbler quoi que ce soit.
 *
 * ── Le collage ────────────────────────────────────────────────────────────
 * Tout collage est ramené en texte brut. C'est la première voie d'entrée de
 * balisage arbitraire dans l'éditeur : un copier-coller depuis Word charge des
 * `<span style>` par dizaines, depuis une page web n'importe quoi. Django
 * assainit de toute façon à l'enregistrement — `core/richtext.py` — mais un
 * auteur doit voir à l'écran ce qui sera publié, pas découvrir après coup que
 * sa mise en forme a sauté.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Ce que l'assainisseur Django accepte ──────────────────────────────────
   La liste blanche de `core.richtext.ALLOWED_TAGS` fait foi. Ce qui est
   produit ici doit rester dedans, sinon l'auteur met en forme et le serveur
   défait. Pas de h1 : le titre de l'article occupe déjà ce niveau. */
const BLOCKS = [
  { value: "p", label: "Paragraphe" },
  { value: "h2", label: "Intertitre" },
  { value: "h3", label: "Sous-titre" },
  { value: "blockquote", label: "Citation" },
] as const;

interface Cmd {
  cmd: string;
  icon: LucideIcon;
  label: string;
  /** Raccourci affiché dans l'infobulle. */
  keys?: string;
}

const INLINE: Cmd[] = [
  { cmd: "bold", icon: Bold, label: "Gras", keys: "Ctrl+B" },
  { cmd: "italic", icon: Italic, label: "Italique", keys: "Ctrl+I" },
  { cmd: "underline", icon: Underline, label: "Souligné", keys: "Ctrl+U" },
  { cmd: "strikeThrough", icon: Strikethrough, label: "Barré" },
];

const LISTS: Cmd[] = [
  { cmd: "insertUnorderedList", icon: List, label: "Liste à puces" },
  { cmd: "insertOrderedList", icon: ListOrdered, label: "Liste numérotée" },
];

/**
 * Un article de l'ancien format est du texte brut : ses retours à la ligne
 * portent toute sa structure. Injecté tel quel dans un `contentEditable`, il
 * s'affiche en un seul paragraphe — l'auteur croirait avoir perdu sa mise en
 * page.
 *
 * On le remonte donc en paragraphes à l'ouverture. La conversion n'a lieu
 * qu'une fois, au premier chargement du champ, et n'est écrite en base que si
 * l'auteur enregistre.
 */
function toEditorHtml(value: string): string {
  if (!value) return "";
  if (/<[a-zA-Z/!][^>]*>/.test(value)) return value;

  return value
    .split(/\n{2,}/)
    .map((block) => {
      const escaped = block
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br>");
      return `<p>${escaped}</p>`;
    })
    .join("");
}

/** `<p><br></p>` est ce que laisse un éditeur vidé : ce n'est pas du contenu. */
export function isRichTextEmpty(html: string): boolean {
  return (
    html
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length === 0
  );
}

function countWords(html: string): number {
  const text = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();
  return text ? text.split(/\s+/).length : 0;
}

export interface RichTextEditorProps {
  /** Nom du champ dans le `FormData` — comme sur un `<input>`. */
  name: string;
  defaultValue?: string | null;
  /** Identifiant cible du `<label>` de la page. */
  id?: string;
  placeholder?: string;
  /** Remonte le HTML courant : sert au parent pour valider avant envoi. */
  onChange?: (html: string) => void;
  "aria-describedby"?: string;
  className?: string;
}

export function RichTextEditor({
  name,
  defaultValue,
  id,
  placeholder = "Racontez l'événement…",
  onChange,
  "aria-describedby": describedBy,
  className,
}: RichTextEditorProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [html, setHtml] = useState(() => toEditorHtml(defaultValue ?? ""));
  const [active, setActive] = useState<Record<string, boolean>>({});
  const [block, setBlock] = useState("p");
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  /* La sélection est perdue dès que le focus part vers le champ d'URL : on la
     met de côté pour la restaurer au moment de poser le lien. */
  const savedRange = useRef<Range | null>(null);
  const linkInputRef = useRef<HTMLInputElement>(null);
  const fallbackId = useId();
  const editorId = id ?? fallbackId;

  /*
   * Le HTML initial est posé une seule fois, à la main. Le passer par
   * `children` ou par `dangerouslySetInnerHTML` ferait réécrire le nœud par
   * React à chaque rendu : le curseur sauterait au début à chaque frappe.
   */
  useEffect(() => {
    const el = areaRef.current;
    /*
     * Un `contentEditable` vide n'a AUCUN bloc : la première ligne saisie
     * reste un nœud de texte nu, et l'article s'enregistre sous la forme
     * « Premier paragraphe.<h2>… ». Ce texte-là n'est dans aucun `<p>`, donc
     * aucune des règles de `.ax-prose` ne l'atteint — il se colle à
     * l'intertitre qui suit, et la mise en page du premier paragraphe diffère
     * de celle de tous les autres.
     *
     * On amorce donc avec un paragraphe vide, ce que fait tout éditeur : la
     * saisie commence à l'intérieur d'un bloc.
     */
    if (el && !el.innerHTML) el.innerHTML = html || "<p><br></p>";
    /* Le champ caché est aligné explicitement plutôt que laissé au seul
       `defaultValue` : un article ouvert puis enregistré sans être touché doit
       partir avec son contenu, et non avec une chaîne vide. */
    if (hiddenRef.current) hiddenRef.current.value = html;
    /* Entrée produit `<p>` et non `<div>` ; le formatage produit `<b>` et non
       `<span style>`. Les deux réglages alignent la sortie sur la liste
       blanche de Django. */
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
      document.execCommand("styleWithCSS", false, "false");
    } catch {
      /* Navigateur sans execCommand : la saisie reste possible, sans mise en
         forme. Mieux vaut un éditeur diminué qu'un écran blanc. */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = useCallback(() => {
    const el = areaRef.current;
    if (!el) return;
    const next = el.innerHTML;
    setHtml(next);
    if (hiddenRef.current) hiddenRef.current.value = next;
    onChange?.(next);
  }, [onChange]);

  /*
   * L'état des boutons suit la sélection, pas les clics : placer le curseur
   * dans un mot déjà en gras doit allumer « Gras ». `selectionchange` est le
   * seul événement qui le dit, et il n'existe que sur `document`.
   */
  useEffect(() => {
    const onSelection = () => {
      const el = areaRef.current;
      const sel = document.getSelection();
      if (!el || !sel || !sel.anchorNode || !el.contains(sel.anchorNode)) return;

      const next: Record<string, boolean> = {};
      for (const { cmd } of [...INLINE, ...LISTS]) {
        try {
          next[cmd] = document.queryCommandState(cmd);
        } catch {
          next[cmd] = false;
        }
      }
      setActive(next);

      /* `queryCommandValue('formatBlock')` renvoie tantôt « h2 », tantôt
         « H2 », tantôt vide selon le moteur. On normalise, et un bloc inconnu
         retombe sur paragraphe plutôt que de laisser le sélecteur mentir. */
      let current = "p";
      try {
        const raw = document.queryCommandValue("formatBlock").toLowerCase();
        if (BLOCKS.some((b) => b.value === raw)) current = raw;
      } catch {
        /* ignoré : le sélecteur affiche « Paragraphe » */
      }
      setBlock(current);
    };

    document.addEventListener("selectionchange", onSelection);
    return () => document.removeEventListener("selectionchange", onSelection);
  }, []);

  /** Toute la surface obsolète du composant tient dans cette fonction. */
  const exec = useCallback(
    (cmd: string, value?: string) => {
      areaRef.current?.focus();
      try {
        document.execCommand(cmd, false, value);
      } catch {
        /* ignoré : voir la note sur les navigateurs sans execCommand */
      }
      sync();
    },
    [sync],
  );

  const openLink = () => {
    const sel = document.getSelection();
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0).cloneRange();
    setLinkValue("");
    setLinkOpen(true);
    /* Le champ n'existe qu'après le rendu : on attend une image avant de lui
       donner le focus. */
    requestAnimationFrame(() => linkInputRef.current?.focus());
  };

  const applyLink = () => {
    const url = linkValue.trim();
    setLinkOpen(false);
    if (!url) return;

    const sel = document.getSelection();
    if (savedRange.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }

    /* Une URL sans protocole (« senegal.sn ») serait interprétée comme un
       chemin relatif au tableau de bord. Django ne garde de toute façon que
       http, https, mailto et tel. */
    const href = /^(https?:|mailto:|tel:)/i.test(url) ? url : `https://${url}`;
    exec("createLink", href);
  };

  const words = countWords(html);
  const empty = isRichTextEmpty(html);

  return (
    <div className={cn("ax-editor", className)}>
      {/* ── Barre d'outils ───────────────────────────────────────────────
          `role="toolbar"` la fait parcourir d'un bloc au clavier plutôt qu'en
          quinze tabulations avant d'atteindre le texte. */}
      <div className="ax-editor__toolbar" role="toolbar" aria-label="Mise en forme">
        <select
          className="ax-select ax-select--sm ax-editor__blocks"
          aria-label="Style de bloc"
          value={block}
          onChange={(e) => exec("formatBlock", `<${e.target.value}>`)}
        >
          {BLOCKS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>

        <span className="ax-divider ax-divider--vertical ax-editor__sep" />

        {INLINE.map(({ cmd, icon: Icon, label, keys }) => (
          <button
            key={cmd}
            type="button"
            className={cn(
              "ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm",
              active[cmd] && "is-selected",
            )}
            aria-pressed={Boolean(active[cmd])}
            aria-label={keys ? `${label} (${keys})` : label}
            title={keys ? `${label} · ${keys}` : label}
            /* `onMouseDown` et non `onClick` : un clic déplace d'abord le
               focus, ce qui efface la sélection à formater. */
            onMouseDown={(e) => {
              e.preventDefault();
              exec(cmd);
            }}
          >
            <Icon className="ax-btn__icon" size={16} aria-hidden="true" />
          </button>
        ))}

        <span className="ax-divider ax-divider--vertical ax-editor__sep" />

        {LISTS.map(({ cmd, icon: Icon, label }) => (
          <button
            key={cmd}
            type="button"
            className={cn(
              "ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm",
              active[cmd] && "is-selected",
            )}
            aria-pressed={Boolean(active[cmd])}
            aria-label={label}
            title={label}
            onMouseDown={(e) => {
              e.preventDefault();
              exec(cmd);
            }}
          >
            <Icon className="ax-btn__icon" size={16} aria-hidden="true" />
          </button>
        ))}

        <button
          type="button"
          className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
          aria-label="Citation"
          title="Citation"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("formatBlock", "<blockquote>");
          }}
        >
          <Quote className="ax-btn__icon" size={16} aria-hidden="true" />
        </button>

        <span className="ax-divider ax-divider--vertical ax-editor__sep" />

        <button
          type="button"
          className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
          aria-label="Insérer un lien"
          title="Insérer un lien"
          aria-expanded={linkOpen}
          onMouseDown={(e) => {
            e.preventDefault();
            openLink();
          }}
        >
          <Link2 className="ax-btn__icon" size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
          aria-label="Retirer le lien"
          title="Retirer le lien"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("unlink");
          }}
        >
          <Link2Off className="ax-btn__icon" size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
          aria-label="Effacer la mise en forme"
          title="Effacer la mise en forme"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("removeFormat");
          }}
        >
          <RemoveFormatting className="ax-btn__icon" size={16} aria-hidden="true" />
        </button>

        <span className="ax-editor__spacer" />

        <button
          type="button"
          className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
          aria-label="Annuler"
          title="Annuler · Ctrl+Z"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("undo");
          }}
        >
          <Undo2 className="ax-btn__icon" size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm"
          aria-label="Rétablir"
          title="Rétablir · Ctrl+Maj+Z"
          onMouseDown={(e) => {
            e.preventDefault();
            exec("redo");
          }}
        >
          <Redo2 className="ax-btn__icon" size={16} aria-hidden="true" />
        </button>
      </div>

      {/* ── Champ d'URL ───────────────────────────────────────────────────
          Un `prompt()` natif serait plus court, mais son texte n'est pas
          traduisible et il bloque le fil — les deux raisons qui ont déjà fait
          écarter l'`<input type="file">` natif au profit de <FileDrop>. */}
      {linkOpen && (
        <div className="ax-editor__linkbar">
          <input
            ref={linkInputRef}
            type="url"
            className="ax-input ax-input--sm"
            placeholder="https://…"
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            aria-label="Adresse du lien"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setLinkOpen(false);
                areaRef.current?.focus();
              }
            }}
          />
          <button type="button" className="ax-btn ax-btn--sm ax-btn--primary" onClick={applyLink}>
            <span className="ax-btn__label">Poser</span>
          </button>
          <button
            type="button"
            className="ax-btn ax-btn--sm ax-btn--ghost"
            onClick={() => {
              setLinkOpen(false);
              areaRef.current?.focus();
            }}
          >
            <span className="ax-btn__label">Annuler</span>
          </button>
        </div>
      )}

      {/* ── Surface de saisie ─────────────────────────────────────────────
          `role="textbox"` + `aria-multiline` : sans eux, un lecteur d'écran
          annonce un groupe et non un champ de saisie. */}
      <div
        ref={areaRef}
        id={editorId}
        className="ax-editor__area"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="Contenu de l'article"
        aria-describedby={describedBy}
        data-placeholder={placeholder}
        data-empty={empty || undefined}
        onInput={sync}
        onBlur={sync}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          exec("insertText", text);
        }}
      />

      {/* ── Pied de statut ── */}
      <div className="ax-editor__status">
        <span>
          {words} {words > 1 ? "mots" : "mot"}
          {words > 0 && ` · ~${Math.max(1, Math.round(words / 200))} min de lecture`}
        </span>
        <span>Mise en forme simple · le collage est ramené en texte</span>
      </div>

      {/* Le champ réel : c'est lui qui part dans le FormData. */}
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={html} />
    </div>
  );
}

export default RichTextEditor;
