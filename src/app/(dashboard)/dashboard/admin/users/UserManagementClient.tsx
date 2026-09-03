"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Utilisateurs et rôles
 * ═══════════════════════════════════════════════════════════════════════════
 * Deux onglets : l'annuaire complet, et la file des demandes (pièces
 * d'identité, titres). Le sélecteur de Daara passe sur <DaaraCombobox>, qui
 * était jusqu'ici recopié ici ET dans « Annonces Hub ».
 *
 * Corrections de fond :
 *
 *   · Les notes de rejet passaient par `window.prompt()` — même problème que
 *     dans Pilotage : boîte native bloquante, sans contexte, impossible à
 *     styler. Elles passent sur <Modal>.
 *
 *   · Les cartes de demande d'inscription étaient posées sur `bg-white` en dur,
 *     donc invisibles en thème sombre (texte blanc sur blanc).
 *
 *   · L'import Excel crée les comptes avec un mot de passe unique écrit dans le
 *     source (`YessalPassword2024!`). Le comportement est conservé — c'est un
 *     chantier backend, consigné dans AGENTS/REFONTE_DETTE.md — mais la modale
 *     l'ANNONCE désormais à l'administrateur, qui l'ignorait.
 *
 *   · La recherche et le tri étaient réimplémentés à la main ; ils passent sur
 *     `useCollection`, avec le tri sur l'ensemble et non sur la page.
 */

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  FileText,
  FileUp,
  FileWarning,
  Inbox,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  createUserByAdmin,
  deleteUserAction,
  resetMemberPasswordAction,
  reviewTitleRequest,
  updateUserAction,
  updateUserRole,
  updateUserStatus,
  validateDocument,
} from "@/app/actions/users";
import { ExportButton } from "@/components/ExportButton";
import PhoneNumberValidation from "@/components/PhoneNumberValidation";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/vireo/Avatar";
import {
  DaaraCombobox,
  type DaaraOption,
} from "@/components/vireo/DaaraCombobox";
import { DataTable, type Column } from "@/components/vireo/DataTable";
import { FilterBar } from "@/components/vireo/FilterBar";
import { checkFileSize } from "@/components/vireo/FileDrop";
import { Menu } from "@/components/vireo/Menu";
import { Modal } from "@/components/vireo/Modal";
import { Pagination } from "@/components/vireo/Pagination";
import { StatusBadge, statusLabel } from "@/components/vireo/StatusBadge";
import { CoverImage } from "@/components/vireo/CoverImage";
import { ALL, useCollection } from "@/hooks/useCollection";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  status: string;
  daara?: { id?: number; name?: string | null } | null;
  documents_count?: number;
  avatar?: string | null;
  avatar_url?: string | null;
}

export interface PendingDoc {
  id: number;
  user_name?: string;
  doc_type: string;
  image: string;
  image_verso?: string;
  status: string;
  created_at: string;
}

export interface TitleRequest {
  id: number;
  member_name: string;
  title_name: string;
  status: string;
  created_at: string;
}

/** `accounts.User.Role` */
const ROLES = [
  { value: "admin", label: "Administrateur" },
  { value: "chef_daara", label: "Chef de Daara" },
  { value: "collector", label: "Collecteur" },
  { value: "member", label: "Talibé" },
];

const ROLE_LABEL: Record<string, string> = Object.fromEntries(
  ROLES.map((r) => [r.value, r.label]),
);

/** `accounts.UserDocument.DocType` */
const DOC_TYPE_LABEL: Record<string, string> = {
  national_id: "Carte nationale d'identité",
  passport: "Passeport",
  voter_id: "Carte d'électeur",
  driver_license: "Permis de conduire",
};

/** Mot de passe attribué par l'import Excel — voir AGENTS/REFONTE_DETTE.md §2. */
const IMPORT_DEFAULT_PASSWORD = "YessalPassword2024!";

type SortKey = "name" | "role" | "status" | "daara";
type Tab = "list" | "requests";

type RefusalTarget =
  | { kind: "title"; id: number; label: string }
  | { kind: "document"; id: number; label: string };

const fullName = (u: User) =>
  `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();

export function UserManagementClient({
  initialUsers,
  daaras,
  initialPendingDocs,
  initialTitleRequests,
}: {
  initialUsers: User[];
  daaras: DaaraOption[];
  initialPendingDocs: PendingDoc[];
  initialTitles?: unknown[];
  initialTitleRequests: TitleRequest[];
}) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [pendingDocs, setPendingDocs] = useState(initialPendingDocs);
  const [titleRequests, setTitleRequests] = useState(initialTitleRequests);

  const [tab, setTab] = useState<Tab>("list");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [, startTransition] = useTransition();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  /* Le mot de passe qui vient d'être attribué, le temps de le transmettre. */
  const [issued, setIssued] = useState<{ name: string; password: string } | null>(
    null,
  );
  const [selectedDaaraId, setSelectedDaaraId] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lightboxDoc, setLightboxDoc] = useState<PendingDoc | null>(null);
  const [refusal, setRefusal] = useState<RefusalTarget | null>(null);
  const [refusalNote, setRefusalNote] = useState("");

  const queueCount = pendingDocs.length + titleRequests.length;

  const searchable = useMemo(
    () => (u: User) => [u.first_name, u.last_name, u.email, u.phone, u.daara?.name],
    [],
  );

  const filters = useMemo(
    () => ({
      role: (u: User, v: string) => u.role === v,
      status: (u: User, v: string) => u.status === v,
    }),
    [],
  );

  const sorters = useMemo(
    () => ({
      name: (u: User) => fullName(u),
      role: (u: User) => u.role,
      status: (u: User) => u.status,
      daara: (u: User) => u.daara?.name ?? "",
    }),
    [],
  );

  const c = useCollection(users, {
    searchable,
    filters,
    sorters,
    initialSort: { key: "name", dir: "asc" },
    pageSize: 12,
  });

  const pendingUsers = useMemo(
    () => users.filter((u) => u.status === "pending"),
    [users],
  );

  const exportData = useMemo(
    () =>
      c.matched.map((u) => ({
        Nom: u.last_name,
        Prénom: u.first_name,
        Email: u.email,
        Téléphone: u.phone,
        Rôle: ROLE_LABEL[u.role] ?? u.role,
        Statut: statusLabel("user", u.status),
        Daara: u.daara?.name || "Global",
      })),
    [c.matched],
  );

  /* ── Actions sur les comptes ── */

  const handleStatusUpdate = async (
    user: User,
    action: "validate" | "block",
  ) => {
    setBusyId(user.id);
    const { error } = await updateUserStatus(user.id, action);
    setBusyId(null);

    if (error) {
      toast.error(error);
      return;
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? { ...u, status: action === "validate" ? "active" : "blocked" }
          : u,
      ),
    );
    toast.success(
      action === "validate"
        ? `Compte de ${fullName(user)} validé.`
        : `Accès de ${fullName(user)} bloqué.`,
    );
  };

  const handleRoleUpdate = async (user: User, newRole: string) => {
    setBusyId(user.id);
    const { error } = await updateUserRole(user.id, newRole);
    setBusyId(null);

    if (error) {
      toast.error(error);
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)),
    );
    toast.success(`${fullName(user)} est désormais ${ROLE_LABEL[newRole]}.`);
  };

  /*
   * Assistance : un membre a perdu son mot de passe et n'a pas d'adresse
   * e-mail valide — le cas d'une bonne part des comptes créés sur le terrain.
   * Il ne peut donc pas passer par « mot de passe oublié », et appelle un
   * administrateur, qui lui en dicte un nouveau.
   *
   * La confirmation est demandée AVANT : l'ancien mot de passe cesse
   * immédiatement de fonctionner, et quelqu'un qui utilisait encore son compte
   * se retrouverait dehors sans comprendre pourquoi.
   */
  const handleResetPassword = (user: User) => {
    toast(`Réinitialiser le mot de passe de ${fullName(user)} ?`, {
      description:
        "Son mot de passe actuel cessera aussitôt de fonctionner. Le nouveau ne s'affichera qu'une fois.",
      action: {
        label: "Réinitialiser",
        onClick: () =>
          startTransition(async () => {
            const res = await resetMemberPasswordAction(user.id);
            if (res.error) {
              toast.error(res.error);
              return;
            }
            setIssued({ name: fullName(user), password: res.password ?? "" });
          }),
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  const handleDeleteUser = (user: User) => {
    toast(`Supprimer définitivement le compte de ${fullName(user)} ?`, {
      description: "Cette action est irréversible.",
      action: {
        label: "Supprimer",
        onClick: async () => {
          const { error } = await deleteUserAction(user.id);
          if (error) {
            toast.error(error);
            return;
          }
          setUsers((prev) => prev.filter((u) => u.id !== user.id));
          toast.success("Compte supprimé.");
        },
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  /* ── File d'attente ── */

  const handleApproveDocument = async (doc: PendingDoc) => {
    const res = await validateDocument(doc.id, "validated", "");
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setPendingDocs((prev) => prev.filter((d) => d.id !== doc.id));
    toast.success("Document validé.");
  };

  const handleApproveTitle = async (req: TitleRequest) => {
    const res = await reviewTitleRequest(req.id, "approve", "");
    if (res.error) {
      toast.error(res.error);
      return;
    }
    setTitleRequests((prev) => prev.filter((r) => r.id !== req.id));
    toast.success("Demande approuvée.");
    router.refresh();
  };

  const submitRefusal = async () => {
    if (!refusal) return;
    const note = refusalNote.trim();

    const res =
      refusal.kind === "title"
        ? await reviewTitleRequest(refusal.id, "refuse", note)
        : await validateDocument(refusal.id, "rejected", note);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    if (refusal.kind === "title") {
      setTitleRequests((prev) => prev.filter((r) => r.id !== refusal.id));
      toast.success("Demande refusée.");
    } else {
      setPendingDocs((prev) => prev.filter((d) => d.id !== refusal.id));
      toast.success("Document rejeté.");
    }

    setRefusal(null);
    setRefusalNote("");
  };

  /* ── Import Excel ── */

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tooBig = checkFileSize(file);
    if (tooBig) {
      toast.error(tooBig);
      e.target.value = "";
      return;
    }

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        let successCount = 0;
        for (const row of rows) {
          const { error } = await createUserByAdmin({
            first_name: row["Prénom"] ?? row["first_name"],
            last_name: row["Nom"] ?? row["last_name"],
            email: row["Email"] ?? row["email"],
            phone: row["Téléphone"] ?? row["phone"],
            role: row["Rôle"] ?? row["role"] ?? "member",
            password: IMPORT_DEFAULT_PASSWORD,
          });
          if (!error) successCount++;
        }

        toast.success(
          `${successCount} compte${successCount > 1 ? "s" : ""} importé${successCount > 1 ? "s" : ""} sur ${rows.length}.`,
        );
        router.refresh();
      } catch (err) {
        toast.error(`Erreur lors de l'import : ${String(err)}`);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsBinaryString(file);
  };

  /* ── Création / édition ── */

  const handleSubmitCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));
      const { error, data: newUser } = await createUserByAdmin({
        ...data,
        daara_id: selectedDaaraId || null,
      });
      if (error) {
        toast.error(error);
        return;
      }
      setUsers((prev) => [newUser as User, ...prev]);
      setIsAddOpen(false);
      setSelectedDaaraId("");
      toast.success("Compte créé.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSaving(true);
    try {
      const data = Object.fromEntries(new FormData(e.currentTarget));
      const { error, data: updated } = await updateUserAction(editingUser.id, {
        ...data,
        daara_id: selectedDaaraId || null,
      });
      if (error) {
        toast.error(error);
        return;
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? (updated as User) : u)),
      );
      setEditingUser(null);
      setSelectedDaaraId("");
      toast.success("Compte mis à jour.");
    } finally {
      setIsSaving(false);
    }
  };

  const columns = useMemo<Column<User, SortKey>[]>(
    () => [
      {
        key: "user",
        header: "Utilisateur",
        sortKey: "name",
        cell: (u) => (
          <div className="flex items-center gap-3">
            <Avatar src={u.avatar || u.avatar_url} name={fullName(u)} size="sm" />
            <div className="min-w-0">
              <Link
                href={`/dashboard/users/${u.id}`}
                className="ax-link ax-truncate block font-medium"
              >
                {fullName(u)}
              </Link>
              <span className="ax-text-subtle ax-truncate block text-xs">
                {u.email}
              </span>
            </div>
          </div>
        ),
      },
      {
        key: "role",
        header: "Rôle",
        sortKey: "role",
        cell: (u) => (
          <Menu
            label={`Changer le rôle de ${fullName(u)}`}
            trigger={
              <button
                type="button"
                className="ax-badge ax-badge--outline ax-badge--sm cursor-pointer"
              >
                {ROLE_LABEL[u.role] ?? u.role}
              </button>
            }
            items={ROLES.filter((r) => r.value !== u.role).map((r) => ({
              label: r.label,
              onSelect: () => handleRoleUpdate(u, r.value),
              disabled: busyId === u.id,
            }))}
          />
        ),
      },
      {
        key: "status",
        header: "Statut",
        sortKey: "status",
        cell: (u) => <StatusBadge domain="user" value={u.status} size="sm" />,
      },
      {
        key: "daara",
        header: "Daara",
        sortKey: "daara",
        hideBelow: "md",
        cell: (u) =>
          u.daara?.name || <span className="ax-text-subtle">Global</span>,
      },
      {
        key: "actions",
        header: "Actions",
        headerHidden: true,
        numeric: true,
        cell: (u) => (
          <Menu
            label={`Actions pour ${fullName(u)}`}
            items={[
              {
                label: "Modifier",
                icon: Pencil,
                onSelect: () => {
                  setSelectedDaaraId(u.daara?.id ? String(u.daara.id) : "");
                  setEditingUser(u);
                },
              },
              ...(u.status !== "active"
                ? [
                    {
                      label: "Valider le compte",
                      icon: Check,
                      onSelect: () => handleStatusUpdate(u, "validate"),
                    },
                  ]
                : []),
              {
                label: "Réinitialiser le mot de passe",
                icon: KeyRound,
                separatorBefore: true,
                onSelect: () => handleResetPassword(u),
              },
              ...(u.status !== "blocked"
                ? [
                    {
                      label: "Bloquer l'accès",
                      icon: ShieldAlert,
                      onSelect: () => handleStatusUpdate(u, "block"),
                    },
                  ]
                : []),
              {
                label: "Supprimer",
                icon: Trash2,
                danger: true,
                separatorBefore: true,
                onSelect: () => handleDeleteUser(u),
              },
            ]}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [busyId],
  );

  /* Corps de formulaire commun création / édition. */
  const userFields = (user: User | null) => (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="ax-field">
          <label className="ax-field__label" htmlFor="u-first">
            Prénom
            <span className="ax-field__required" aria-hidden="true"> *</span>
          </label>
          <input
            id="u-first"
            name="first_name"
            className="ax-input"
            defaultValue={user?.first_name ?? ""}
            placeholder="Moussa"
            required
          />
        </div>
        <div className="ax-field">
          <label className="ax-field__label" htmlFor="u-last">
            Nom
            <span className="ax-field__required" aria-hidden="true"> *</span>
          </label>
          <input
            id="u-last"
            name="last_name"
            className="ax-input"
            defaultValue={user?.last_name ?? ""}
            placeholder="Diop"
            required
          />
        </div>
      </div>

      <div className="ax-field">
        <label className="ax-field__label" htmlFor="u-email">
          E-mail
          <span className="ax-field__required" aria-hidden="true"> *</span>
        </label>
        <input
          id="u-email"
          name="email"
          type="email"
          className="ax-input"
          defaultValue={user?.email ?? ""}
          placeholder="email@exemple.com"
          required
        />
      </div>

      <div className="ax-field">
        <PhoneNumberValidation
          name="phone"
          defaultValue={user?.phone?.replace("+", "") || "221"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="ax-field">
          <label className="ax-field__label" htmlFor="u-role">
            Rôle
          </label>
          <select
            id="u-role"
            name="role"
            className="ax-select"
            defaultValue={user?.role ?? "member"}
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ax-field">
          <label className="ax-field__label" htmlFor="u-daara">
            Daara
          </label>
          <DaaraCombobox
            id="u-daara"
            daaras={daaras}
            value={selectedDaaraId}
            onChange={setSelectedDaaraId}
            neutralLabel="Global — aucun Daara"
          />
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="ax-tabs">
        <div className="ax-tabs__list" role="tablist">
          <button
            type="button"
            role="tab"
            className="ax-tabs__tab"
            aria-selected={tab === "list"}
            onClick={() => setTab("list")}
          >
            <Users className="ax-tabs__icon" size={15} aria-hidden="true" />
            Comptes
            <span className="ax-tabs__badge ax-badge ax-badge--count ax-badge--sm">
              {users.length}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            className="ax-tabs__tab"
            aria-selected={tab === "requests"}
            onClick={() => setTab("requests")}
          >
            <Inbox className="ax-tabs__icon" size={15} aria-hidden="true" />
            Demandes
            {queueCount > 0 && (
              <span className="ax-tabs__badge ax-badge ax-badge--warning ax-badge--sm">
                {queueCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ══ Comptes ══ */}
      {tab === "list" && (
        <div className="flex flex-col gap-4" role="tabpanel">
          {/* Inscriptions en attente — traitement rapide, sans quitter l'écran. */}
          {pendingUsers.length > 0 && (
            <section className="ax-card ax-card--accent-edge">
              <div className="ax-card__header">
                <div className="ax-card__titles">
                  <h2 className="ax-card__title">
                    Demandes d&apos;inscription
                  </h2>
                  <p className="ax-card__subtitle">
                    Validez ou refusez les nouveaux comptes.
                  </p>
                </div>
                <span className="ax-badge ax-badge--warning ax-badge--sm">
                  {pendingUsers.length}
                </span>
              </div>

              <div className="ax-card__body grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {pendingUsers.map((u) => (
                  <div
                    key={u.id}
                    className="ax-card ax-card--compact flex items-center gap-3 p-3"
                  >
                    <Avatar
                      src={u.avatar || u.avatar_url}
                      name={fullName(u)}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="ax-truncate text-sm font-medium">
                        {fullName(u)}
                      </div>
                      <div className="ax-text-subtle ax-truncate text-xs">
                        {u.phone || u.email}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        className="ax-btn ax-btn--soft-success ax-btn--icon ax-btn--sm"
                        aria-label={`Valider ${fullName(u)}`}
                        onClick={() => handleStatusUpdate(u, "validate")}
                        disabled={busyId === u.id}
                      >
                        {busyId === u.id ? (
                          <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                        ) : (
                          <Check size={13} aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        className="ax-btn ax-btn--soft-danger ax-btn--icon ax-btn--sm"
                        aria-label={`Bloquer ${fullName(u)}`}
                        onClick={() => handleStatusUpdate(u, "block")}
                        disabled={busyId === u.id}
                      >
                        <X size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/*
            L'import Excel attribue le MEME mot de passe a tous les comptes
            crees. C'est un defaut connu (chantier backend, voir
            AGENTS/REFONTE_DETTE.md) ; en attendant, l'administrateur doit au
            moins le savoir avant d'importer un fichier.
          */}
          <div className="ax-alert ax-alert--warning ax-alert--inline">
            <ShieldAlert className="ax-alert__icon" aria-hidden="true" />
            <div className="ax-alert__content">
              <p className="ax-alert__message">
                Les comptes créés par import Excel reçoivent tous le même mot de
                passe provisoire{" "}
                <code className="ax-code">{IMPORT_DEFAULT_PASSWORD}</code>. Un
                bandeau leur demandera de le remplacer dès leur première
                connexion, et restera affiché tant que ce ne sera pas fait.
              </p>
            </div>
          </div>

          <FilterBar
            searchValue={c.search}
            onSearchChange={c.setSearch}
            searchPlaceholder="Nom, e-mail, téléphone ou Daara…"
            resultCount={c.total}
            itemLabel="compte"
            filters={[
              {
                label: "Rôle",
                value: c.filter("role"),
                onChange: (v) => c.setFilter("role", v),
                options: [
                  { value: ALL, label: "Tous les rôles" },
                  ...ROLES.map((r) => ({ value: r.value, label: r.label })),
                ],
              },
              {
                label: "Statut",
                value: c.filter("status"),
                onChange: (v) => c.setFilter("status", v),
                options: [
                  { value: ALL, label: "Tous les statuts" },
                  { value: "active", label: "Actif" },
                  { value: "pending", label: "À valider" },
                  { value: "inactive", label: "Inactif" },
                  { value: "blocked", label: "Bloqué" },
                ],
              },
            ]}
            actions={
              <>
                <button
                  type="button"
                  className="ax-btn ax-btn--outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <Loader2 className="ax-btn__icon animate-spin" size={16} aria-hidden="true" />
                  ) : (
                    <FileUp className="ax-btn__icon" size={16} aria-hidden="true" />
                  )}
                  <span className="ax-btn__label">Importer</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="ax-visually-hidden"
                  accept=".xlsx,.xls"
                  onChange={handleImportExcel}
                />

                <ExportButton data={exportData} filename="Yessal_Membres" />

                <button
                  type="button"
                  className="ax-btn ax-btn--primary"
                  onClick={() => {
                    setSelectedDaaraId("");
                    setIsAddOpen(true);
                  }}
                >
                  <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
                  <span className="ax-btn__label">Créer un compte</span>
                </button>
              </>
            }
          />

          <div className="ax-card">
            <DataTable
              rows={c.rows}
              columns={columns}
              getRowKey={(u) => u.id}
              sort={c.sort}
              onSort={c.toggleSort}
              caption="Comptes de la plateforme"
              rowTone={(u) =>
                u.status === "blocked"
                  ? "danger"
                  : u.status === "pending"
                    ? "warning"
                    : undefined
              }
              empty={
                <div className="ax-card__body">
                  <EmptyState
                    icon={c.isFiltered ? Search : Users}
                    tone={c.isFiltered ? "search" : "neutral"}
                    title={
                      c.isFiltered
                        ? "Aucun compte ne correspond"
                        : "Aucun compte enregistré"
                    }
                    description={
                      c.isFiltered
                        ? "Élargissez la recherche ou remettez les filtres à zéro."
                        : "Créez un compte, ou importez un fichier Excel."
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
            itemLabel="comptes"
          />
        </div>
      )}

      {/* ══ Demandes ══ */}
      {tab === "requests" && (
        <div className="flex flex-col gap-4" role="tabpanel">
          {queueCount === 0 && (
            <div className="ax-card">
              <div className="ax-card__body">
                <EmptyState
                  icon={Inbox}
                  tone="success"
                  title="Rien à traiter"
                  description="Aucune pièce d'identité ni demande de titre en attente."
                />
              </div>
            </div>
          )}

          {pendingDocs.length > 0 && (
            <section className="ax-card">
              <div className="ax-card__header">
                <span className="ax-card__kpi-icon ax-card__kpi-icon--c3" aria-hidden="true">
                  <FileText />
                </span>
                <div className="ax-card__titles">
                  <h2 className="ax-card__title">
                    Vérification d&apos;identité
                  </h2>
                </div>
                <span className="ax-badge ax-badge--warning ax-badge--sm">
                  {pendingDocs.length}
                </span>
              </div>

              <div className="ax-card__body grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pendingDocs.map((doc) => (
                  <article key={doc.id} className="ax-card ax-card--compact">
                    <div className="ax-card__body flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="ax-truncate text-sm font-medium">
                            {doc.user_name || "Membre"}
                          </p>
                          <p className="ax-text-subtle text-xs">
                            {DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type}
                          </p>
                        </div>
                        <StatusBadge domain="document" value="pending" size="sm" />
                      </div>

                      {doc.image && (
                        <button
                          type="button"
                          onClick={() => setLightboxDoc(doc)}
                          className="w-full cursor-zoom-in"
                          aria-label="Agrandir le document"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={doc.image}
                            alt=""
                            className="h-32 w-full rounded-(--ax-radius-sm) border border-(--ax-border) object-cover"
                          />
                        </button>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="ax-btn ax-btn--soft-success ax-btn--sm flex-1"
                          onClick={() => handleApproveDocument(doc)}
                        >
                          <Check className="ax-btn__icon" size={14} aria-hidden="true" />
                          <span className="ax-btn__label">Valider</span>
                        </button>
                        <button
                          type="button"
                          className="ax-btn ax-btn--soft-danger ax-btn--sm flex-1"
                          onClick={() => {
                            setRefusalNote("");
                            setRefusal({
                              kind: "document",
                              id: doc.id,
                              label: `${doc.user_name || "Membre"} — ${DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type}`,
                            });
                          }}
                        >
                          <X className="ax-btn__icon" size={14} aria-hidden="true" />
                          <span className="ax-btn__label">Rejeter</span>
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {titleRequests.length > 0 && (
            <section className="ax-card">
              <div className="ax-card__header">
                <div className="ax-card__titles">
                  <h2 className="ax-card__title">Demandes de titres</h2>
                </div>
                <span className="ax-badge ax-badge--warning ax-badge--sm">
                  {titleRequests.length}
                </span>
              </div>

              <ul className="ax-list ax-list--comfortable">
                {titleRequests.map((req) => (
                  <li key={req.id} className="ax-list__row">
                    <span className="ax-list__content">
                      <span className="ax-list__title">{req.member_name}</span>
                      <span className="ax-list__meta">
                        demande le titre de{" "}
                        <span className="ax-text-strong">{req.title_name}</span>
                      </span>
                    </span>

                    <span className="ax-list__trailing gap-2">
                      <button
                        type="button"
                        className="ax-btn ax-btn--soft-success ax-btn--sm"
                        onClick={() => handleApproveTitle(req)}
                      >
                        <Check className="ax-btn__icon" size={14} aria-hidden="true" />
                        <span className="ax-btn__label">Approuver</span>
                      </button>
                      <button
                        type="button"
                        className="ax-btn ax-btn--soft-danger ax-btn--sm"
                        onClick={() => {
                          setRefusalNote("");
                          setRefusal({
                            kind: "title",
                            id: req.id,
                            label: `${req.member_name} — ${req.title_name}`,
                          });
                        }}
                      >
                        <X className="ax-btn__icon" size={14} aria-hidden="true" />
                        <span className="ax-btn__label">Refuser</span>
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* ── Création ── */}
      <Modal
        open={isAddOpen}
        onOpenChange={(o) => {
          setIsAddOpen(o);
          if (!o) setSelectedDaaraId("");
        }}
        title="Créer un compte"
        description="Le membre pourra se connecter avec l'e-mail et le mot de passe saisis."
        size="md"
      >
        <form onSubmit={handleSubmitCreate} className="flex flex-col gap-4">
          {userFields(null)}

          <div className="ax-field">
            <label className="ax-field__label" htmlFor="u-password">
              Mot de passe
              <span className="ax-field__required" aria-hidden="true"> *</span>
            </label>
            <input
              id="u-password"
              name="password"
              type="password"
              className="ax-input"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="ax-btn ax-btn--primary ax-btn--block"
            disabled={isSaving}
          >
            <span className="ax-btn__label">
              {isSaving ? "Création…" : "Créer le compte"}
            </span>
          </button>
        </form>
      </Modal>

      {/* ── Édition ── */}
      <Modal
        open={Boolean(editingUser)}
        onOpenChange={(o) => {
          if (!o) {
            setEditingUser(null);
            setSelectedDaaraId("");
          }
        }}
        title="Modifier le compte"
        description={editingUser ? fullName(editingUser) : undefined}
        size="md"
      >
        {editingUser && (
          <form
            key={editingUser.id}
            onSubmit={handleSubmitEdit}
            className="flex flex-col gap-4"
          >
            {userFields(editingUser)}

            <button
              type="submit"
              className="ax-btn ax-btn--primary ax-btn--block"
              disabled={isSaving}
            >
              <span className="ax-btn__label">
                {isSaving ? "Enregistrement…" : "Enregistrer les modifications"}
              </span>
            </button>
          </form>
        )}
      </Modal>

      {/* ── Note de refus (remplace window.prompt) ── */}
      <Modal
        open={Boolean(refusal)}
        onOpenChange={(o) => {
          if (!o) {
            setRefusal(null);
            setRefusalNote("");
          }
        }}
        title={
          refusal?.kind === "title"
            ? "Refuser la demande"
            : "Rejeter le document"
        }
        description={refusal?.label}
        status="warning"
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="ax-btn ax-btn--ghost"
              onClick={() => setRefusal(null)}
            >
              <span className="ax-btn__label">Annuler</span>
            </button>
            <button
              type="button"
              className="ax-btn ax-btn--danger"
              onClick={submitRefusal}
            >
              <span className="ax-btn__label">
                {refusal?.kind === "title" ? "Refuser" : "Rejeter"}
              </span>
            </button>
          </>
        }
      >
        <div className="ax-field">
          <label className="ax-field__label" htmlFor="user-refusal-note">
            Motif
          </label>
          <textarea
            id="user-refusal-note"
            rows={4}
            className="ax-textarea"
            value={refusalNote}
            onChange={(e) => setRefusalNote(e.target.value)}
            placeholder="Ce motif sera visible par le membre."
          />
          <p className="ax-field__hint">
            Facultatif, mais un refus sans explication oblige le membre à
            deviner ce qu&apos;il doit corriger.
          </p>
        </div>
      </Modal>

      {/* ── Agrandissement d'un document ── */}
      <Modal
        open={Boolean(lightboxDoc)}
        onOpenChange={(o) => !o && setLightboxDoc(null)}
        title={
          lightboxDoc
            ? (DOC_TYPE_LABEL[lightboxDoc.doc_type] ?? lightboxDoc.doc_type)
            : ""
        }
        description={lightboxDoc?.user_name ?? undefined}
        size="lg"
      >
        {lightboxDoc && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(["image", "image_verso"] as const).map((key) => {
              const src = lightboxDoc[key];
              if (!src) return null;
              const label = key === "image" ? "Recto" : "Verso";
              return (
                <figure key={key} className="flex flex-col gap-1">
                  <figcaption className="ax-eyebrow">{label}</figcaption>
                  <a href={src} target="_blank" rel="noopener noreferrer">
                    {/*
                      Un fichier manquant doit se DIRE, pas se deviner. Une
                      vignette cassée peut passer pour un défaut d'affichage,
                      et rien n'est plus fâcheux ici : on valide une pièce
                      d'identité. <CoverImage> affiche l'icône d'alerte, qui
                      ne ressemble à aucun document valide.
                    */}
                    <CoverImage
                      src={src}
                      alt={`${label} du document`}
                      icon={FileWarning}
                      iconSize={40}
                      className="w-full rounded-(--ax-radius-sm) border border-(--ax-border)"
                      fallbackClassName="aspect-3/2 w-full rounded-(--ax-radius-sm) border border-(--ax-border)"
                    />
                  </a>
                </figure>
              );
            })}
          </div>
        )}
      </Modal>

      {/*
        Le mot de passe attribué, une fois et une seule. Il n'est stocké nulle
        part : fermer cette fenêtre l'efface définitivement, et il faudra
        recommencer. C'est dit explicitement, parce que la personne au bout du
        fil attend qu'on le lui dicte.
      */}
      <Modal
        open={issued !== null}
        onOpenChange={(open) => !open && setIssued(null)}
        title="Nouveau mot de passe"
        description={
          issued ? `Dictez-le à ${issued.name}. Il ne sera plus affiché.` : undefined
        }
        status="success"
        size="sm"
        footer={
          <button
            type="button"
            className="ax-btn ax-btn--primary"
            onClick={() => setIssued(null)}
          >
            <span className="ax-btn__label">J&apos;ai transmis le mot de passe</span>
          </button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="ax-field__control">
            <span className="ax-field__affix ax-field__affix--leading">
              <KeyRound aria-hidden="true" />
            </span>
            <input
              readOnly
              value={issued?.password ?? ""}
              aria-label="Nouveau mot de passe"
              className="ax-input ax-input--lg ax-input--with-leading-icon ax-input--with-trailing font-mono tracking-wider"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              className="ax-field__affix ax-field__affix--trailing ax-field__affix--button"
              aria-label="Copier le mot de passe"
              onClick={async () => {
                if (!issued) return;
                try {
                  await navigator.clipboard.writeText(issued.password);
                  toast.success("Mot de passe copié.");
                } catch {
                  toast.error("Copie impossible — notez-le à l'écran.");
                }
              }}
            >
              <Copy aria-hidden="true" />
            </button>
          </div>

          <p className="ax-text-muted text-sm leading-relaxed">
            {issued?.name} devra le remplacer à sa prochaine connexion : un
            bandeau le lui rappellera tant que ce ne sera pas fait.
          </p>
        </div>
      </Modal>
    </div>
  );
}
