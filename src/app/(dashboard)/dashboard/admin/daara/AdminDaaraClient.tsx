"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Gestion des Daaras et des zones LDD
 * ═══════════════════════════════════════════════════════════════════════════
 * Deux objets, deux onglets `.ax-tabs` : les Daaras (liste + création) et les
 * zones LDD qui les regroupent.
 *
 * Corrections de fond :
 *
 *   · Le tri était réimplémenté à la main, et il triait la LISTE COMPLÈTE mais
 *     paginait après — ce qui était correct — tandis que les autres écrans
 *     triaient la page. Cette logique passe dans `useCollection`, où elle est
 *     écrite une fois pour tout le produit.
 *
 *   · Les deux premières icônes d'action, « œil » et « crayon », pointaient
 *     vers la MÊME URL (`/dashboard/admin/daara/<id>`). Deux boutons pour une
 *     seule destination : ils fusionnent en une entrée de menu.
 *
 *   · Les actions des cartes de zone étaient en `opacity-0 group-hover` :
 *     inatteignables sur écran tactile.
 *
 *   · Après un import Excel réussi, le code appelait `window.location.reload()`
 *     — un rechargement complet qui perd l'onglet actif et le défilement.
 *     `router.refresh()` recharge les données du serveur sans quitter la page.
 *
 *   · Le champ Description était en `focus:ring-green-500`, un vert sans
 *     rapport avec le reste du formulaire (violet). Détail révélateur : les
 *     anneaux de focus étaient écrits champ par champ.
 */

import { useConfirm } from "@/components/vireo/ConfirmDialog";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRightLeft,
  Building2,
  CheckCircle,
  Layers,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import {
  createDaara,
  createLDD,
  deleteDaara,
  deleteLDD,
  getLDDs,
  importDaaraExcel,
  transferLDDDaaras,
  updateLDD,
  type RapportImport,
} from "@/app/actions/daara";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, type Column } from "@/components/vireo/DataTable";
import { FilterBar } from "@/components/vireo/FilterBar";
import { checkFileSize } from "@/components/vireo/FileDrop";
import { Menu } from "@/components/vireo/Menu";
import { Modal } from "@/components/vireo/Modal";
import { Pagination } from "@/components/vireo/Pagination";
import { StatusBadge } from "@/components/vireo/StatusBadge";
import { ALL, useCollection } from "@/hooks/useCollection";

export interface Ldd {
  id: number;
  code?: string | null;
  name?: string | null;
  /**
   * Compté par le SERVEUR, sur l'ensemble des Daaras.
   *
   * L'écran le recomptait depuis `daaras`, la liste qu'il a sous la main. Elle
   * ne contient que ce que la page a chargé : le chiffre affiché sous une zone
   * décrivait donc la page, pas la zone.
   */
  daaras_count?: number;
}

export interface Daara {
  id: number;
  name?: string | null;
  description?: string | null;
  is_active?: boolean;
  members_count?: number | null;
  memberCount?: number | null;
  ldd?: Ldd | null;
}

type SortKey = "zone" | "name" | "members" | "status";
type Tab = "daaras" | "zones";

/** L'API renvoie soit un tableau, soit une page DRF `{ results: [...] }`. */
function unwrap<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  return ((data as { results?: T[] })?.results ?? []) as T[];
}

const memberCountOf = (d: Daara) => d.members_count ?? d.memberCount ?? 0;

/**
 * Une rubrique du rapport d'import.
 *
 * Repliée au-delà de six entrées : le rapport du fichier sénégalais en compte
 * quatre-vingts, et les dérouler toutes noierait les trois qui demandent une
 * décision. Le COMPTE, lui, reste toujours visible — c'est ce qu'on lit
 * d'abord.
 */
function ListeRapport({
  titre,
  items,
  ton,
}: {
  titre: string;
  items: string[];
  ton?: "danger" | "warn";
}) {
  const [deplie, setDeplie] = useState(false);
  if (!items.length) return null;

  const apercu = deplie ? items : items.slice(0, 6);

  return (
    <div>
      <h3
        className={cn(
          "text-sm font-semibold",
          ton === "danger" && "ax-text-danger",
          ton === "warn" && "ax-text-warning",
        )}
      >
        {titre}{" "}
        <span className="ax-text-subtle font-normal">({items.length})</span>
      </h3>
      <ul className="ax-text-subtle mt-1 flex flex-col gap-1 text-xs">
        {apercu.map((ligne) => (
          <li key={ligne}>{ligne}</li>
        ))}
      </ul>
      {items.length > 6 && (
        <button
          type="button"
          className="ax-btn ax-btn--ghost ax-btn--sm mt-1"
          onClick={() => setDeplie((v) => !v)}
        >
          <span className="ax-btn__label">
            {deplie ? "Replier" : `Voir les ${items.length - 6} autres`}
          </span>
        </button>
      )}
    </div>
  );
}

export function AdminDaaraClient({
  initialDaaras,
}: {
  initialDaaras: Daara[];
}) {
  /* Les suppressions se confirment dans un vrai dialogue : un toast
     expire seul, ne piege pas le focus, et s'affiche dans un coin que
     personne ne regarde au moment du clic. */
  const { ask, dialog } = useConfirm();

  const router = useRouter();
  const [daaras, setDaaras] = useState(initialDaaras);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [tab, setTab] = useState<Tab>("daaras");

  const [isImporting, setIsImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [rapport, setRapport] = useState<RapportImport | null>(null);
  /* Réconciliation NON COCHÉE par défaut : un import de routine ne doit pas
     déplacer des Daaras sans qu'on l'ait demandé. */
  const [reconcilier, setReconcilier] = useState(false);

  const [zoneATransferer, setZoneATransferer] = useState<Ldd | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [ldds, setLdds] = useState<Ldd[]>([]);
  const [lddsLoading, setLddsLoading] = useState(true);
  const [editingZone, setEditingZone] = useState<Ldd | null>(null);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);

  useEffect(() => {
    getLDDs().then((res) => {
      if (res.data) setLdds(unwrap<Ldd>(res.data));
      setLddsLoading(false);
    });
  }, []);

  const searchable = useMemo(
    () => (d: Daara) => [d.name, d.ldd?.name, d.ldd?.code],
    [],
  );

  const filters = useMemo(
    () => ({
      status: (d: Daara, v: string) =>
        v === "active" ? d.is_active !== false : d.is_active === false,
      zone: (d: Daara, v: string) => String(d.ldd?.id ?? "") === v,
    }),
    [],
  );

  const sorters = useMemo(
    () => ({
      zone: (d: Daara) => d.ldd?.code ?? "",
      name: (d: Daara) => d.name ?? "",
      members: (d: Daara) => memberCountOf(d),
      status: (d: Daara) => (d.is_active === false ? "inactif" : "actif"),
    }),
    [],
  );

  const c = useCollection(daaras, {
    searchable,
    filters,
    sorters,
    initialSort: { key: "name", dir: "asc" },
    pageSize: 12,
  });

  const refreshLdds = async () => {
    const res = await getLDDs();
    if (res.data) setLdds(unwrap<Ldd>(res.data));
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tooBig = checkFileSize(file);
    if (tooBig) {
      toast.error(tooBig);
      e.target.value = "";
      return;
    }

    setIsImportModalOpen(false);
    setIsImporting(true);
    setImportMsg("");
    setErrorMsg("");
    setRapport(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("mode", reconcilier ? "reconciliation" : "strict");

    const res = await importDaaraExcel(formData);
    /* Le rapport se lit dans les DEUX cas : en échec, il nomme les lignes
       fautives ; en succès, ce qui a été créé, déplacé, et ce sur quoi le
       serveur a refusé de trancher. */
    setRapport(res.rapport ?? res.data ?? null);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setImportMsg(res.data?.message || "Importation réussie.");
      /* Rafraîchissement des données serveur, sans rechargement complet. */
      router.refresh();
      await refreshLdds();
    }
    setIsImporting(false);
    e.target.value = "";
  };

  const handleCreateDaara = (formData: FormData) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await createDaara(formData);
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      setDaaras((prev) => [...prev, res.data as Daara]);
      toast.success("Daara créé.");
      (
        document.getElementById("daara-create-form") as HTMLFormElement | null
      )?.reset();
    });
  };

  const handleDeleteDaara = (daara: Daara) => {
    ask({
      title: `Supprimer « ${daara.name} » ?`,
        description:
          "Les membres qui y sont rattachés perdront leur affiliation : ils restent inscrits, mais sans Daara.",
      confirmLabel: "Supprimer",
      onConfirm: () =>
          startTransition(async () => {
            const res = await deleteDaara(daara.id);
            if (res.error) {
              toast.error(res.error);
              return;
            }
            setDaaras((prev) => prev.filter((d) => d.id !== daara.id));
            toast.success("Daara supprimé.");
          }),
    });
  };

  const handleZoneSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name") ?? "");
    const code = String(formData.get("code") ?? "");

    startTransition(async () => {
      const res = editingZone
        ? await updateLDD(editingZone.id, { name, code })
        : await createLDD({ name, code });

      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(editingZone ? "Zone mise à jour." : "Zone créée.");
      setIsZoneModalOpen(false);
      setEditingZone(null);
      await refreshLdds();
    });
  };

  const handleZoneDelete = (ldd: Ldd) => {
    const rattaches = ldd.daaras_count ?? 0;

    /* Le texte disait, mot pour mot : « cette action échoue systématiquement —
       l'API ne permet pas de supprimer une zone (HTTP 405) ». C'était exact :
       `LDDViewSet` était en lecture seule. Il ne l'est plus, et la seule chose
       qui puisse encore bloquer est nommée ici AVANT le clic — un aller-retour
       serveur n'apprend rien qu'on ne sache déjà. */
    ask({
      title: `Supprimer la zone « ${ldd.name} » ?`,
      description: rattaches
        ? `Cette zone regroupe ${rattaches} Daara${rattaches > 1 ? "s" : ""}. La suppression sera refusée tant qu'ils y sont rattachés : déplacez-les d'abord vers une autre zone.`
        : "Cette zone ne regroupe aucun Daara. La suppression est définitive.",
      confirmLabel: rattaches ? "Essayer quand même" : "Supprimer",
      onConfirm: () =>
          startTransition(async () => {
            const res = await deleteLDD(ldd.id);
            if (res.error) {
              toast.error(res.error);
              return;
            }
            setLdds((prev) => prev.filter((l) => l.id !== ldd.id));
            toast.success("Zone supprimée.");
          }),
    });
  };

  /**
   * 🔴 CE DÉPLACEMENT S'EST D'ABORD FAIT SUR UN SEUL CLIC.
   *
   * La première version envoyait le transfert dès qu'on touchait une zone de
   * la liste. Sept Daaras ont changé de territoire par mégarde dans l'heure
   * qui a suivi sa mise en ligne — le clic destiné à LIRE la liste des
   * destinations l'a exécutée.
   *
   * Un transfert n'est pas destructeur, mais il touche TOUS les Daaras d'une
   * zone d'un coup, et rien dans l'interface ne permet de le défaire : il faut
   * rejouer un import de réconciliation, ce qu'un administrateur ne devinera
   * pas. D'où la confirmation, qui nomme le nombre et la destination.
   */
  const handleZoneTransfer = (cible: Ldd) => {
    if (!zoneATransferer) return;
    const source = zoneATransferer;
    const nombre = source.daaras_count ?? 0;

    ask({
      title: `Déplacer ${nombre} Daara${nombre > 1 ? "s" : ""} vers « ${cible.name} » ?`,
      description:
        `Tous les Daaras de « ${source.name} » passeront sous « ${cible.name} ». ` +
        "Ils gardent leurs membres, leurs dons et leurs Ndiguels, mais l'opération " +
        "ne se défait pas depuis cet écran.",
      confirmLabel: "Déplacer",
      onConfirm: () =>
        startTransition(async () => {
          const res = await transferLDDDaaras(source.id, cible.id);
          if (res.error) {
            toast.error(res.error);
            return;
          }
          toast.success(res.detail || `${res.moved} Daara(s) déplacé(s).`);
          setZoneATransferer(null);
          router.refresh();
          await refreshLdds();
        }),
    });
  };

  const columns = useMemo<Column<Daara, SortKey>[]>(
    () => [
      {
        key: "zone",
        header: "Zone",
        sortKey: "zone",
        cell: (d) => (
          <div className="flex flex-col">
            <span className="ax-text-accent font-mono text-xs font-semibold">
              {d.ldd?.code ?? "—"}
            </span>
            <span className="ax-text-subtle text-xs">{d.ldd?.name ?? ""}</span>
          </div>
        ),
      },
      {
        key: "name",
        header: "Nom du Daara",
        sortKey: "name",
        cell: (d) => <span className="font-medium">{d.name}</span>,
      },
      {
        key: "members",
        header: "Membres",
        sortKey: "members",
        numeric: true,
        hideBelow: "sm",
        cell: (d) => memberCountOf(d),
      },
      {
        key: "status",
        header: "Statut",
        sortKey: "status",
        cell: (d) => (
          <StatusBadge
            domain="user"
            value={d.is_active === false ? "inactive" : "active"}
            size="sm"
          />
        ),
      },
      {
        key: "actions",
        header: "Actions",
        headerHidden: true,
        numeric: true,
        cell: (d) => (
          <Menu
            label={`Actions pour ${d.name}`}
            items={[
              {
                label: "Ouvrir la fiche",
                icon: Pencil,
                onSelect: () => router.push(`/dashboard/admin/daara/${d.id}`),
              },
              {
                label: "Supprimer",
                icon: Trash2,
                danger: true,
                separatorBefore: true,
                onSelect: () => handleDeleteDaara(d),
              },
            ]}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="ax-tabs">
          <div className="ax-tabs__list" role="tablist">
            <button
              type="button"
              role="tab"
              className="ax-tabs__tab"
              aria-selected={tab === "daaras"}
              onClick={() => setTab("daaras")}
            >
              <Building2 className="ax-tabs__icon" size={15} aria-hidden="true" />
              Daaras
              <span className="ax-tabs__badge ax-badge ax-badge--count ax-badge--sm">
                {daaras.length}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              className="ax-tabs__tab"
              aria-selected={tab === "zones"}
              onClick={() => setTab("zones")}
            >
              <Layers className="ax-tabs__icon" size={15} aria-hidden="true" />
              Zones LDD
              <span className="ax-tabs__badge ax-badge ax-badge--count ax-badge--sm">
                {ldds.length}
              </span>
            </button>
          </div>
        </div>

        <button
          type="button"
          className="ax-btn ax-btn--outline"
          onClick={() => {
            setEditingZone(null);
            setIsZoneModalOpen(true);
          }}
        >
          <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
          <span className="ax-btn__label">Nouvelle zone</span>
        </button>
      </div>

      {importMsg && (
        <div className="ax-alert ax-alert--success" role="status">
          <CheckCircle className="ax-alert__icon" aria-hidden="true" />
          <div className="ax-alert__content">
            <p className="ax-alert__message">{importMsg}</p>
          </div>
          <button
            type="button"
            className="ax-alert__dismiss"
            aria-label="Masquer"
            onClick={() => setImportMsg("")}
          >
            ×
          </button>
        </div>
      )}

      {/* ── Le rapport d'import ──────────────────────────────────────────
          Un import qui touche quatre cents Daaras ne se résume pas à
          « réussi ». L'ancien écran n'affichait qu'une phrase ; quand
          l'import mourait à mi-course — ce qu'il faisait, faute de
          transaction — elle disait « échec » alors que les données étaient
          en partie écrites, et rien ne permettait de savoir quoi. */}
      {rapport && (
        <section className="ax-card" aria-label="Rapport d'import">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h2 className="ax-card__title">Rapport d&apos;import</h2>
              <p className="ax-card__subtitle">
                {rapport.mode === "reconciliation"
                  ? "Mode réconciliation"
                  : "Mode strict"}
                {" · "}
                {rapport.zones_reconnues} zone(s) déjà connue(s),{" "}
                {rapport.daaras_inchanges} Daara(s) inchangé(s)
              </p>
            </div>
            <button
              type="button"
              className="ax-btn ax-btn--ghost ax-btn--icon"
              aria-label="Masquer le rapport"
              onClick={() => setRapport(null)}
            >
              ×
            </button>
          </div>

          <div className="ax-card__body flex flex-col gap-4">
            <ListeRapport titre="Lignes refusées" items={rapport.erreurs} ton="danger" />
            <ListeRapport
              titre="À arbitrer"
              items={rapport.avertissements}
              ton="warn"
            />
            <ListeRapport titre="Zones créées" items={rapport.zones_creees} />
            <ListeRapport
              titre="Daaras réaffectés"
              items={rapport.daaras_deplaces}
            />
            <ListeRapport
              titre="Orthographes alignées"
              items={rapport.orthographes_alignees}
            />
            <ListeRapport titre="Daaras créés" items={rapport.daaras_crees} />
            <ListeRapport
              titre="Lignes ignorées"
              items={rapport.lignes_ignorees}
            />
          </div>
        </section>
      )}

      {/* ══ Daaras ══ */}
      {tab === "daaras" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" role="tabpanel">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <FilterBar
              searchValue={c.search}
              onSearchChange={c.setSearch}
              searchPlaceholder="Nom du Daara, zone ou code…"
              resultCount={c.total}
              itemLabel="Daara"
              filters={[
                {
                  label: "Statut",
                  value: c.filter("status"),
                  onChange: (v) => c.setFilter("status", v),
                  options: [
                    { value: ALL, label: "Tous les statuts" },
                    { value: "active", label: "Actifs" },
                    { value: "inactive", label: "Inactifs" },
                  ],
                },
                ...(ldds.length > 1
                  ? [
                      {
                        label: "Zone LDD",
                        value: c.filter("zone"),
                        onChange: (v: string) => c.setFilter("zone", v),
                        options: [
                          { value: ALL, label: "Toutes les zones" },
                          ...ldds.map((l) => ({
                            value: String(l.id),
                            label: `${l.code ?? ""} — ${l.name ?? ""}`,
                          })),
                        ],
                      },
                    ]
                  : []),
              ]}
            />

            <div className="ax-card">
              <DataTable
                rows={c.rows}
                columns={columns}
                getRowKey={(d) => d.id}
                rowHref={(d) => `/dashboard/admin/daara/${d.id}`}
                sort={c.sort}
                onSort={c.toggleSort}
                caption="Daaras enregistrés"
                empty={
                  <div className="ax-card__body">
                    <EmptyState
                      icon={Building2}
                      tone={c.isFiltered ? "search" : "neutral"}
                      title={
                        c.isFiltered
                          ? "Aucun Daara ne correspond"
                          : "Aucun Daara enregistré"
                      }
                      description={
                        c.isFiltered
                          ? "Élargissez la recherche ou remettez les filtres à zéro."
                          : "Importez un fichier Excel, ou créez un Daara depuis le formulaire ci-contre."
                      }
                      action={
                        c.isFiltered ? (
                          <button
                            type="button"
                            className="ax-btn ax-btn--outline"
                            onClick={c.resetFilters}
                          >
                            <span className="ax-btn__label">
                              Réinitialiser les filtres
                            </span>
                          </button>
                        ) : undefined
                      }
                    />
                  </div>
                }
              />
            </div>

            <Pagination
              page={c.page}
              totalPages={c.totalPages}
              onPageChange={c.setPage}
              totalItems={c.total}
              pageSize={c.pageSize}
              itemLabel="Daaras"
            />
          </div>

          {/* Formulaire de création */}
          <aside className="lg:col-span-1">
            <section className="ax-card lg:sticky lg:top-6">
              <div className="ax-card__header">
                <span className="ax-card__kpi-icon ax-card__kpi-icon--c1" aria-hidden="true">
                  <Building2 />
                </span>
                <div className="ax-card__titles">
                  <h2 className="ax-card__title">Nouveau Daara</h2>
                </div>

                {/* Un BOUTON, et non plus un champ fichier déguisé.
                    Le fichier partait au serveur dès qu'il était choisi : rien
                    ne s'interposait entre un clic distrait et quatre cents
                    Daaras modifiés, et le mode d'import — qui décide si des
                    Daaras sont DÉPLACÉS — n'avait nulle part où se choisir. */}
                <button
                  type="button"
                  className="ax-btn ax-btn--ghost ax-btn--icon"
                  title="Importer un fichier Excel"
                  onClick={() => setIsImportModalOpen(true)}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <span className="ax-spinner ax-spinner--sm" aria-label="Import en cours" />
                  ) : (
                    <Upload size={16} aria-hidden="true" />
                  )}
                  <span className="ax-visually-hidden">
                    Importer un fichier Excel
                  </span>
                </button>
              </div>

              <div className="ax-card__body">
                <form
                  id="daara-create-form"
                  action={handleCreateDaara}
                  className="flex flex-col gap-4"
                >
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="ldd_id">
                      Zone LDD
                      <span className="ax-field__required" aria-hidden="true"> *</span>
                    </label>

                    {lddsLoading ? (
                      <span className="ax-skeleton ax-skeleton--rect h-10 w-full" />
                    ) : ldds.length === 0 ? (
                      <div className="ax-alert ax-alert--warning ax-alert--inline">
                        <AlertCircle className="ax-alert__icon" aria-hidden="true" />
                        <div className="ax-alert__content">
                          <p className="ax-alert__message">
                            Aucune zone enregistrée. Créez-en une, ou importez un
                            fichier Excel.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <select
                        id="ldd_id"
                        name="ldd_id"
                        className="ax-select"
                        required
                        defaultValue=""
                      >
                        <option value="" disabled>
                          Choisir une zone…
                        </option>
                        {ldds.map((ldd) => (
                          <option key={ldd.id} value={ldd.id}>
                            [{ldd.code}] {ldd.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="daara-name">
                      Nom du Daara
                      <span className="ax-field__required" aria-hidden="true"> *</span>
                    </label>
                    <input
                      id="daara-name"
                      name="name"
                      className="ax-input"
                      placeholder="Ex. Daara de Dakar Plateau"
                      required
                    />
                  </div>

                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="daara-description">
                      Description
                    </label>
                    <textarea
                      id="daara-description"
                      name="description"
                      rows={3}
                      className="ax-textarea"
                      placeholder="Précisions géographiques ou historiques…"
                    />
                  </div>

                  {errorMsg && (
                    <p className="ax-field__message ax-field__message--error">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="ax-btn ax-btn--primary ax-btn--block"
                    disabled={isPending || ldds.length === 0}
                  >
                    <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
                    <span className="ax-btn__label">
                      {isPending ? "Création…" : "Ajouter le Daara"}
                    </span>
                  </button>
                </form>
              </div>
            </section>
          </aside>
        </div>
      )}

      {/* ══ Zones LDD ══ */}
      {tab === "zones" && (
        <div role="tabpanel">
          {ldds.length === 0 ? (
            <div className="ax-card">
              <div className="ax-card__body">
                <EmptyState
                  icon={Layers}
                  title="Aucune zone enregistrée"
                  description="Les zones LDD regroupent les Daaras par territoire."
                  action={
                    <button
                      type="button"
                      className="ax-btn ax-btn--primary"
                      onClick={() => {
                        setEditingZone(null);
                        setIsZoneModalOpen(true);
                      }}
                    >
                      <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
                      <span className="ax-btn__label">Nouvelle zone</span>
                    </button>
                  }
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ldds.map((ldd) => {
                /* Le serveur compte sur TOUS les Daaras ; `daaras` ne
                   contient que ce que la page a chargé. Le repli couvre une
                   réponse d'API plus ancienne. */
                const count =
                  ldd.daaras_count ??
                  daaras.filter((d) => d.ldd?.id === ldd.id).length;
                return (
                  <article key={ldd.id} className="ax-card">
                    <div className="ax-card__header">
                      <span
                        className="ax-card__kpi-icon ax-card__kpi-icon--c3"
                        aria-hidden="true"
                      >
                        <Layers />
                      </span>
                      <div className="ax-card__titles">
                        <h3 className="ax-card__title">{ldd.name}</h3>
                        <p className="ax-card__subtitle">
                          {count} Daara{count > 1 ? "s" : ""} rattaché
                          {count > 1 ? "s" : ""}
                        </p>
                      </div>

                      {/* Actions toujours visibles : le survol n'existe pas au doigt. */}
                      <Menu
                        label={`Actions pour la zone ${ldd.name}`}
                        items={[
                          {
                            label: "Modifier",
                            icon: Pencil,
                            onSelect: () => {
                              setEditingZone(ldd);
                              setIsZoneModalOpen(true);
                            },
                          },
                          {
                            label: "Déplacer les Daaras…",
                            icon: ArrowRightLeft,
                            disabled: count === 0,
                            onSelect: () => setZoneATransferer(ldd),
                          },
                          {
                            label: "Supprimer",
                            icon: Trash2,
                            danger: true,
                            separatorBefore: true,
                            onSelect: () => handleZoneDelete(ldd),
                          },
                        ]}
                      />
                    </div>

                    <div className="ax-card__body">
                      <span className="ax-badge ax-badge--accent ax-badge--sm font-mono">
                        {ldd.code}
                      </span>
                      <span className="ax-text-subtle ms-2 text-xs">Code LDD</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Import : le mode se choisit AVANT le fichier ── */}
      <Modal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        title="Importer des Daaras"
        description="Classeur à trois colonnes : DAARA, LDD, CODE LDD."
        size="sm"
      >
        <div className="flex flex-col gap-4">
          <fieldset className="ax-field">
            <legend className="ax-field__label">Que faire des écarts ?</legend>

            {/* `items-start` : `.ax-check` centre verticalement, ce qui
                renvoie la puce au milieu d'un intitulé de quatre lignes,
                loin du titre qu'elle désigne. Les utilitaires Tailwind
                l'emportent sur `@layer components`. */}
            <label className="ax-check items-start">
              <input
                type="radio"
                name="mode-import"
                className="ax-radio"
                checked={!reconcilier}
                onChange={() => setReconcilier(false)}
              />
              <span>
                N&apos;ajouter que ce qui manque
                <span className="ax-text-subtle block text-xs">
                  Les zones et Daaras absents sont créés. Rien n&apos;est déplacé
                  ni renommé : un rattachement inattendu est signalé, pas corrigé.
                </span>
              </span>
            </label>

            <label className="ax-check items-start">
              <input
                type="radio"
                name="mode-import"
                className="ax-radio"
                checked={reconcilier}
                onChange={() => setReconcilier(true)}
              />
              <span>
                Réconcilier avec le fichier
                <span className="ax-text-subtle block text-xs">
                  Réaffecte en plus les Daaras dont le rattachement est
                  manifestement fautif, et aligne les orthographes. Un Daara
                  n&apos;est déplacé que si le fichier ne laisse aucun doute ; les
                  cas ambigus restent signalés pour arbitrage.
                </span>
              </span>
            </label>
          </fieldset>

          <label className="ax-btn ax-btn--primary cursor-pointer self-start">
            <Upload className="ax-btn__icon" size={16} aria-hidden="true" />
            <span className="ax-btn__label">Choisir le fichier…</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="ax-visually-hidden"
              onChange={handleImport}
              disabled={isImporting}
            />
          </label>
        </div>
      </Modal>

      {/* ── Transfert en bloc des Daaras d'une zone ── */}
      <Modal
        open={zoneATransferer !== null}
        onOpenChange={(o) => {
          if (!o) setZoneATransferer(null);
        }}
        title={`Déplacer les Daaras de « ${zoneATransferer?.name ?? ""} »`}
        description="Les Daaras gardent leurs membres, leurs dons et leurs Ndiguels : seule leur zone change."
        size="sm"
      >
        <div className="flex flex-col gap-3">
          <p className="ax-text-subtle text-sm">
            {zoneATransferer?.daaras_count ?? 0} Daara
            {(zoneATransferer?.daaras_count ?? 0) > 1 ? "s" : ""} à déplacer.
            Choisissez la zone de destination.
          </p>
          <div className="flex flex-col gap-1">
            {ldds
              .filter((z) => z.id !== zoneATransferer?.id)
              .map((z) => (
                <button
                  key={z.id}
                  type="button"
                  className="ax-btn ax-btn--ghost justify-start"
                  disabled={isPending}
                  onClick={() => handleZoneTransfer(z)}
                >
                  <span className="ax-badge ax-badge--accent ax-badge--sm font-mono">
                    {z.code}
                  </span>
                  <span className="ax-btn__label ms-2">{z.name}</span>
                  <span className="ax-text-subtle ms-auto text-xs">
                    {z.daaras_count ?? 0}
                  </span>
                </button>
              ))}
          </div>
        </div>
      </Modal>

      {/* ── Zone : création / édition ── */}
      <Modal
        open={isZoneModalOpen}
        onOpenChange={(o) => {
          setIsZoneModalOpen(o);
          if (!o) setEditingZone(null);
        }}
        title={editingZone ? "Modifier la zone" : "Nouvelle zone LDD"}
        description="Les zones regroupent les Daaras par territoire."
        size="sm"
      >
        {/* `key` force la remise à zéro des valeurs par défaut quand on passe
            d'une zone à une autre, ou de l'édition à la création. */}
        <form
          key={editingZone?.id ?? "new"}
          onSubmit={handleZoneSubmit}
          className="flex flex-col gap-4"
        >
          <div className="ax-field">
            <label className="ax-field__label" htmlFor="zone-name">
              Nom de la zone
              <span className="ax-field__required" aria-hidden="true"> *</span>
            </label>
            <input
              id="zone-name"
              name="name"
              className="ax-input"
              defaultValue={editingZone?.name ?? ""}
              placeholder="Ex. Zone Dakar Nord"
              required
            />
          </div>

          <div className="ax-field">
            <label className="ax-field__label" htmlFor="zone-code">
              Code
              <span className="ax-field__required" aria-hidden="true"> *</span>
            </label>
            <input
              id="zone-code"
              name="code"
              className="ax-input font-mono uppercase"
              defaultValue={editingZone?.code ?? ""}
              placeholder="DKR"
              required
            />
            <p className="ax-field__hint">Trois à quatre lettres.</p>
          </div>

          <button
            type="submit"
            className="ax-btn ax-btn--primary ax-btn--block"
            disabled={isPending}
          >
            <span className="ax-btn__label">
              {isPending
                ? "Enregistrement…"
                : editingZone
                  ? "Mettre à jour"
                  : "Créer la zone"}
            </span>
          </button>
        </form>
      </Modal>
      {dialog}
    </div>
  );
}
