"use client";

/**
 * Créer ou régler un canal du Kourel — et régler un salon par titre.
 * Administration seulement (arbitrages du 2026-10-30) :
 *
 *   · nom, description, icône (liste fermée) ;
 *   · audience : tout le Kourel, ou ciblée par titre, rôle, LDD, Daara — les
 *     catégories se combinent en ET, les valeurs d'une catégorie en OU, et
 *     l'abonnement suit les membres qui entrent ou sortent de l'audience ;
 *   · notifications push du canal ;
 *   · « Les Jëfs du Kourel » : afficher les montants (consentis) ;
 *   · archiver / réactiver.
 *
 * Un canal fondateur (Sangue Bi, Jëfs) reste pour tout le Kourel et ne
 * s'archive pas : ces deux sections n'y apparaissent pas.
 */
import { useEffect, useMemo, useState, useTransition } from "react";
import { Archive, ArchiveRestore, Search } from "lucide-react";
import { toast } from "sonner";
import {
  archiveChat,
  createChannel,
  getAudienceOptions,
  updateChatSettings,
  type AudienceOptions,
  type ChannelSettingsPayload,
} from "@/app/actions/comms";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ROLE_OPTIONS } from "@/lib/roles";
import { CHANNEL_ICONS } from "./ChannelIcons";
import type { Audience, ChatRow } from "./types";

type Facet = "titles" | "roles" | "ldds" | "daaras";

function vide(a: Audience | null | undefined) {
  return !a || !Object.values(a).some((v) => v && v.length);
}

/** « Les Serigne ou les Sokhna · de la LDD Casamance » */
export function resumeAudience(a: Audience | null | undefined, options: AudienceOptions | null): string {
  if (vide(a)) return "Tout le Kourel";
  const noms = (ids: number[] | undefined, liste: { id: number; name: string }[] | undefined) =>
    (ids ?? []).map((id) => liste?.find((x) => x.id === id)?.name ?? `#${id}`);
  const parts: string[] = [];
  const titres = noms(a!.titles, options?.titles);
  if (titres.length) parts.push(titres.map((t) => `les ${t}`).join(" ou "));
  const roles = (a!.roles ?? []).map((r) => ROLE_OPTIONS.find((o) => o.value === r)?.label ?? r);
  if (roles.length) parts.push(roles.join(" ou "));
  const ldds = noms(a!.ldds, options?.ldds);
  if (ldds.length) parts.push(`de la LDD ${ldds.join(" ou ")}`);
  const daaras = noms(a!.daaras, options?.daaras);
  if (daaras.length) parts.push(`du Daara ${daaras.join(" ou ")}`);
  return parts.join(" · ");
}

export function ChannelSettings({
  open,
  mode,
  chat,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** `create` : nouveau canal. `edit` : le canal (ou salon par titre) `chat`. */
  mode: "create" | "edit";
  chat?: ChatRow | null;
  onClose: () => void;
  onSaved: (chatId: number) => void;
}) {
  const isChannel = mode === "create" || chat?.chat_type === "channel";
  const isTitleSalon = chat?.chat_type === "group" && !vide(chat.audience);
  const isSystem = Boolean(chat?.is_system);
  const canTarget = mode === "create" || (!isSystem && (isChannel || isTitleSalon));

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [push, setPush] = useState(true);
  const [amounts, setAmounts] = useState(false);
  const [cible, setCible] = useState(false);
  const [audience, setAudience] = useState<Audience>({});
  const [facet, setFacet] = useState<Facet>("titles");
  const [filtre, setFiltre] = useState("");
  const [options, setOptions] = useState<AudienceOptions | null>(null);
  const [erreur, setErreur] = useState("");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    setErreur("");
    setFiltre("");
    setName(mode === "edit" ? chat?.display_name ?? "" : "");
    setDescription(mode === "edit" ? chat?.description ?? "" : "");
    setIcon(mode === "edit" ? chat?.icon ?? "" : "megaphone");
    setPush(mode === "edit" ? chat?.push_enabled ?? true : true);
    setAmounts(Boolean(chat?.show_amounts));
    setCible(mode === "edit" ? !vide(chat?.audience) : false);
    setAudience(chat?.audience ?? {});
    setFacet("titles");
  }, [open, mode, chat]);

  /* Les listes (titres, LDD, Daaras) se chargent une fois, à la première
     ouverture — et pas dans l'effet ci-dessus, qui remettrait le formulaire à
     zéro à leur arrivée. */
  useEffect(() => {
    if (open && !options) void getAudienceOptions().then(setOptions);
  }, [open, options]);

  const basculer = (cle: Facet, valeur: number | string) =>
    setAudience((a) => {
      const liste = (a[cle] ?? []) as (number | string)[];
      const suivante = liste.includes(valeur) ? liste.filter((v) => v !== valeur) : [...liste, valeur];
      return { ...a, [cle]: suivante };
    });

  const choix = useMemo(() => {
    const q = filtre.trim().toLowerCase();
    const garde = (n: string) => !q || n.toLowerCase().includes(q);
    if (facet === "roles") return ROLE_OPTIONS.filter((r) => garde(r.label)).map((r) => ({ id: r.value as string | number, name: r.label }));
    const liste = facet === "titles" ? options?.titles : facet === "ldds" ? options?.ldds : options?.daaras;
    return (liste ?? []).filter((x) => garde(x.name)).slice(0, 200).map((x) => ({ id: x.id as string | number, name: x.name }));
  }, [facet, filtre, options]);

  const enregistrer = () => {
    setErreur("");
    if (!name.trim()) return setErreur("Donnez un nom au canal.");
    if (isTitleSalon && vide(audience)) return setErreur("Un salon par titre garde au moins un titre.");
    if (cible && vide(audience)) return setErreur("Choisissez au moins un critère, ou « Tout le Kourel ».");
    const payload: ChannelSettingsPayload = { name: name.trim(), description: description.trim(), icon };
    if (isChannel) payload.push_enabled = push;
    if (chat?.channel_kind === "jefs") payload.show_amounts = amounts;
    if (canTarget) payload.audience = cible || isTitleSalon ? audience : null;
    start(async () => {
      const res = mode === "create" ? await createChannel(payload) : await updateChatSettings(chat!.id, payload);
      if (res.error) return setErreur(res.error);
      const id = (res.data as { id?: number } | undefined)?.id ?? chat?.id;
      toast.success(mode === "create" ? `Canal « ${name.trim()} » créé.` : "Réglages enregistrés.");
      if (id) onSaved(id);
      onClose();
    });
  };

  const archiver = () =>
    start(async () => {
      const archive = !chat?.archived_at;
      const res = await archiveChat(chat!.id, archive);
      if (res.error) return setErreur(res.error);
      toast.success(archive ? "Archivé : il disparaît des listes, l'historique est conservé." : "Réactivé.");
      onSaved(chat!.id);
      onClose();
    });

  const titre =
    mode === "create" ? "Nouveau canal du Kourel" : isTitleSalon ? `Réglages du salon « ${chat?.display_name} »` : `Réglages de « ${chat?.display_name} »`;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{titre}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label htmlFor="canal-nom" className="ax-field__label">Nom</label>
            <input id="canal-nom" className="ax-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Programme du Magal" maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="canal-desc" className="ax-field__label">Description</label>
            <input
              id="canal-desc"
              className="ax-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ce qu'on y trouve, en une phrase"
              maxLength={255}
            />
          </div>

          <fieldset className="space-y-1.5">
            <legend className="ax-field__label">Icône</legend>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}>
              {Object.entries(CHANNEL_ICONS).map(([cle, { icon: Icon, label }]) => (
                <button
                  key={cle}
                  type="button"
                  onClick={() => setIcon(cle)}
                  aria-pressed={icon === cle}
                  aria-label={label}
                  title={label}
                  className={`flex h-11 items-center justify-center rounded-xl border transition-colors ${
                    icon === cle ? "border-[#4E2E9E] bg-[#EEE9FC] text-[#2F1966]" : "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon size={19} aria-hidden />
                </button>
              ))}
            </div>
          </fieldset>

          {canTarget && (
            <fieldset className="space-y-2">
              <legend className="ax-field__label">{isTitleSalon ? "Titres du salon" : "Qui le reçoit ?"}</legend>
              {!isTitleSalon && (
                <div className="ax-tabs ax-tabs--pill">
                  <div className="ax-tabs__list" role="tablist" aria-label="Audience">
                    <button type="button" role="tab" className="ax-tabs__tab" aria-selected={!cible} onClick={() => setCible(false)}>
                      Tout le Kourel
                    </button>
                    <button type="button" role="tab" className="ax-tabs__tab" aria-selected={cible} onClick={() => setCible(true)}>
                      Une audience ciblée
                    </button>
                  </div>
                </div>
              )}
              {(cible || isTitleSalon) && (
                <div className="space-y-2 rounded-xl border p-3">
                  {!isTitleSalon && (
                    <div className="flex flex-wrap gap-1" role="tablist" aria-label="Critère">
                      {(
                        [
                          ["titles", "Titres"],
                          ["roles", "Rôles"],
                          ["ldds", "LDD"],
                          ["daaras", "Daaras"],
                        ] as [Facet, string][]
                      ).map(([cle, label]) => (
                        <button
                          key={cle}
                          type="button"
                          role="tab"
                          aria-selected={facet === cle}
                          onClick={() => {
                            setFacet(cle);
                            setFiltre("");
                          }}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${facet === cle ? "bg-[#2F1966] text-white" : "bg-muted text-muted-foreground"}`}
                        >
                          {label}
                          {audience[cle]?.length ? ` · ${audience[cle]!.length}` : ""}
                        </button>
                      ))}
                    </div>
                  )}
                  {(facet === "ldds" || facet === "daaras") && (
                    <div className="ax-field__control">
                      <span className="ax-field__affix ax-field__affix--leading"><Search aria-hidden="true" /></span>
                      <input
                        className="ax-input ax-input--sm ax-input--with-leading-icon"
                        placeholder={facet === "ldds" ? "Chercher une LDD…" : "Chercher un Daara…"}
                        aria-label="Filtrer"
                        value={filtre}
                        onChange={(e) => setFiltre(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 overflow-y-auto" style={{ maxHeight: 176 }}>
                    {!options && <p className="text-xs text-muted-foreground">Chargement…</p>}
                    {options && choix.length === 0 && <p className="text-xs text-muted-foreground">Aucun résultat.</p>}
                    {choix.map((c) => {
                      const on = ((audience[facet] ?? []) as (string | number)[]).includes(c.id);
                      return (
                        <button
                          key={`${facet}-${c.id}`}
                          type="button"
                          aria-pressed={on}
                          onClick={() => basculer(facet, c.id)}
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                            on ? "border-[#4E2E9E] bg-[#EEE9FC] text-[#2F1966]" : "border-border text-foreground hover:bg-muted"
                          }`}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-foreground">{resumeAudience(audience, options)}</strong>
                    {" — l'abonnement suit les membres qui entrent ou sortent de cette audience."}
                  </p>
                </div>
              )}
            </fieldset>
          )}

          {isChannel && (
            <label className="flex items-start justify-between gap-3 rounded-xl border p-3">
              <span>
                <span className="block text-sm font-semibold">Notifications sur les téléphones</span>
                <span className="block text-xs text-muted-foreground">Chaque publication sonne chez les abonnés (sauf sourdine).</span>
              </span>
              <input type="checkbox" className="ax-switch" checked={push} onChange={(e) => setPush(e.target.checked)} />
            </label>
          )}

          {chat?.channel_kind === "jefs" && (
            <label className="flex items-start justify-between gap-3 rounded-xl border p-3">
              <span>
                <span className="block text-sm font-semibold">Afficher les montants</span>
                <span className="block text-xs text-muted-foreground">
                  Seulement pour les Jëfs dont le donateur a accepté d&apos;être nommé. Un Jëf anonyme reste toujours sans montant.
                </span>
              </span>
              <input type="checkbox" className="ax-switch" checked={amounts} onChange={(e) => setAmounts(e.target.checked)} />
            </label>
          )}

          {erreur && <p className="ax-field__message ax-field__message--error">{erreur}</p>}
        </div>

        <DialogFooter className="flex-wrap gap-2 pt-2 sm:justify-between">
          {mode === "edit" && !isSystem ? (
            <button type="button" className="ax-btn ax-btn--ghost-danger" onClick={archiver} disabled={pending}>
              {chat?.archived_at ? <ArchiveRestore size={15} aria-hidden /> : <Archive size={15} aria-hidden />}
              <span className="ax-btn__label">{chat?.archived_at ? "Réactiver" : "Archiver"}</span>
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className="ax-btn ax-btn--ghost" onClick={onClose}>
              <span className="ax-btn__label">Annuler</span>
            </button>
            <button type="button" className="ax-btn ax-btn--primary" onClick={enregistrer} disabled={pending}>
              <span className="ax-btn__label">{pending ? "Enregistrement…" : mode === "create" ? "Créer le canal" : "Enregistrer"}</span>
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
