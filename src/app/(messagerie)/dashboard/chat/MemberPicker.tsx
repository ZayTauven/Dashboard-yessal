"use client";

/**
 * Choisir des membres par la RECHERCHE du serveur — comme le mobile.
 *
 * Jusqu'au 2026-10-30, le web cochait dans l'annuaire chargé d'un bloc : il
 * ne suivait ni le pilotage ni les préférences, ne montrait ni les admins ni
 * la guide, et pas le même Kourel que le téléphone. `comms/search-members/`
 * fait désormais foi des deux côtés.
 *
 * Le Daara figure sous chaque nom : sans photo, c'est lui qui départage deux
 * homonymes.
 */
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { searchMembers } from "@/app/actions/comms";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { initials, roleLabel } from "./format";
import type { DirectorySearchUser } from "./types";

const MIN_QUERY = 2;
const DEBOUNCE_MS = 250;

export function MemberPicker({
  selected,
  onChange,
  excludeIds,
  single = false,
  pour = "salon",
  heightClass = "h-56",
}: {
  selected: DirectorySearchUser[];
  onChange: (next: DirectorySearchUser[]) => void;
  /** Déjà membres : on ne les propose pas. */
  excludeIds?: Set<number>;
  /** Un seul choix (désigner un auteur). */
  single?: boolean;
  pour?: "salon";
  heightClass?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DirectorySearchUser[] | null>(null);
  const [searching, setSearching] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* Une réponse lente à « Fa » ne doit pas écraser celle de « Fatou ». */
  const ticket = useRef(0);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onQuery = (next: string) => {
    setQuery(next);
    if (timer.current) clearTimeout(timer.current);
    const q = next.trim();
    if (q.length < MIN_QUERY) {
      ticket.current++;
      setResults(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    const mien = ++ticket.current;
    timer.current = setTimeout(async () => {
      const res = await searchMembers(q, pour);
      if (mien !== ticket.current) return;
      setResults((res.data as DirectorySearchUser[]) ?? []);
      setSearching(false);
    }, DEBOUNCE_MS);
  };

  const selectedIds = new Set(selected.map((u) => u.id));
  const toggle = (u: DirectorySearchUser) => {
    if (selectedIds.has(u.id)) onChange(selected.filter((x) => x.id !== u.id));
    else onChange(single ? [u] : [...selected, u]);
  };
  const shown = (results ?? []).filter((u) => !excludeIds?.has(u.id));

  return (
    <div className="space-y-2">
      <div className="ax-field__control">
        <span className="ax-field__affix ax-field__affix--leading">
          <Search aria-hidden="true" />
        </span>
        <input
          className="ax-input ax-input--sm ax-input--with-leading-icon"
          placeholder="Nom, Daara, e-mail ou numéro…"
          aria-label="Chercher un membre"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => toggle(u)}
              className="inline-flex items-center gap-1 rounded-full bg-[#EEE9FC] px-2.5 py-1 text-xs font-medium text-[#2F1966]"
              aria-label={`Retirer ${u.name} de la sélection`}
            >
              {u.name}
              <X size={12} aria-hidden />
            </button>
          ))}
        </div>
      )}

      <div className={`${heightClass} overflow-y-auto rounded-xl border p-2`}>
        {results === null ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            {searching ? "Recherche…" : "Tapez au moins deux lettres."}
          </p>
        ) : searching ? (
          <p className="py-8 text-center text-xs text-muted-foreground">Recherche…</p>
        ) : shown.length === 0 ? (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">
            Personne ne correspond. Un membre qui a restreint sa visibilité n&apos;apparaît pas ici.
          </p>
        ) : (
          <div className="space-y-0.5">
            {shown.map((u) => (
              <label key={u.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50">
                <Checkbox checked={selectedIds.has(u.id)} onCheckedChange={() => toggle(u)} />
                <Avatar className="h-8 w-8">
                  {u.avatar ? <AvatarImage src={u.avatar} alt="" /> : null}
                  <AvatarFallback className="bg-[#7954D4] text-[10px] font-bold text-white">{initials(u.name)}</AvatarFallback>
                </Avatar>
                <span className="min-w-0">
                  <span className="block truncate font-medium">{u.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">
                    {[roleLabel(u.role), u.daara_name || "Sans Daara"].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
