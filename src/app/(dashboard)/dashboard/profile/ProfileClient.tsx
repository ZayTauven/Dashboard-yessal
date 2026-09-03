"use client";

/*
 * ═══════════════════════════════════════════════════════════════════════════
 * Mon profil
 * ═══════════════════════════════════════════════════════════════════════════
 * Repris des patrons `pages/Profile` et `pages/ProfileSettings` de Vireo :
 * bandeau de couverture avec avatar cerclé, rail de gauche (complétion, titre),
 * et le reste en ONGLETS.
 *
 * Les onglets sont l'apport principal. La page empilait dix-sept champs, une
 * section documents et deux formulaires sur un seul défilement : pour changer
 * une photo de pièce d'identité, il fallait passer devant tout l'état civil.
 * Deux panneaux — « Informations » et « Pièces d'identité » — rendent les deux
 * tâches également accessibles.
 *
 * Bugs corrigés au passage :
 *
 *   · Les aperçus de document pointaient sur `/placeholder-doc.png`, qui
 *     n'existe pas dans `public/`. Sans document déposé, la case affichait
 *     donc une image cassée à 10 % d'opacité. Elle est remplacée par une vraie
 *     zone de dépôt (`.ax-dropzone`).
 *
 *   · `URL.createObjectURL` était appelé à chaque rendu sans jamais être
 *     révoqué : chaque frappe dans un champ voisin fabriquait une URL de blob
 *     de plus, retenue jusqu'au rechargement de la page.
 *
 *   · Le statut du document se peignait en `bg-green-50/50 text-green-700`,
 *     invisible en thème sombre, avec son propre vocabulaire. Il passe par
 *     <StatusBadge domain="document">.
 */

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Camera,
  Check,
  FileText,
  IdCard,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  createUserDocument,
  submitTitleRequest,
  updateProfile,
  updateUserDocument,
} from "@/app/actions/users";
import PhoneNumberValidation from "@/components/PhoneNumberValidation";
import { roleLabelLong } from "@/lib/roles";
import { DatePicker } from "@/components/ui/DatePicker";
import { Avatar } from "@/components/vireo/Avatar";
import { CardHeader } from "@/components/vireo/CardHeader";
import { PasswordChangeForm } from "@/components/vireo/PasswordChangeForm";
import { CoverBand } from "@/components/vireo/CoverBand";
import { StatusBadge } from "@/components/vireo/StatusBadge";
import { checkFileSize } from "@/components/vireo/FileDrop";

/*
 * Garde de taille commun aux dépôts de cet écran. Ils ont chacun leur propre
 * interface — l'appareil photo sur l'avatar, les deux faces de la pièce — donc
 * une zone de dépôt complète serait de trop ; il leur manquait seulement le
 * contrôle. Un fichier trop lourd est écarté ici, avant même d'être mis en
 * aperçu.
 */
function guardSize(e: React.ChangeEvent<HTMLInputElement>): File | null {
  const file = e.target.files?.[0] ?? null;
  if (!file) return null;

  const tooBig = checkFileSize(file);
  if (tooBig) {
    toast.error(tooBig);
    e.target.value = "";
    return null;
  }
  return file;
}

type TitleOption = { id: number; name: string; is_active?: boolean };

type UserDocument = {
  id: number;
  doc_type: string;
  image?: string;
  image_verso?: string;
  status: "pending" | "validated" | "rejected";
  rejection_note?: string;
  doc_number?: string;
};

/** Forme du profil telle que la renvoie `getProfile`. Remplace l'ancien `any`. */
export interface ProfilePayload {
  id?: number;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  avatar?: string | null;
  avatar_url?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  residence_country?: string | null;
  city?: string | null;
  address?: string | null;
  state?: string | null;
  zip_code?: string | null;
  marital_status?: string | null;
  blood_type?: string | null;
  daara_name?: string | null;
  title?: { name?: string } | null;
  /* Vrai quand le mot de passe a été attribué par un tiers. */
  must_change_password?: boolean | null;
}

const DOC_TYPES = [
  { value: "national_id", label: "Carte nationale d'identité" },
  { value: "passport", label: "Passeport" },
  { value: "voter_id", label: "Carte d'électeur" },
  { value: "driver_license", label: "Permis de conduire" },
];

type Tab = "infos" | "documents" | "security";

export function ProfileClient({
  profile,
  titles,
  initialDocuments,
}: {
  profile: ProfilePayload | null;
  titles: TitleOption[];
  initialDocuments: UserDocument[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("infos");
  const [selectedTitleId, setSelectedTitleId] = useState("");
  const [documents, setDocuments] = useState<UserDocument[]>(
    initialDocuments || [],
  );
  const [docType, setDocType] = useState("national_id");
  const [docNumber, setDocNumber] = useState("");
  const [rectoFile, setRectoFile] = useState<File | null>(null);
  const [versoFile, setVersoFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const docMap = useMemo(() => {
    const map = new Map<string, UserDocument>();
    for (const d of documents) map.set(d.doc_type, d);
    return map;
  }, [documents]);

  const selectedDoc = docMap.get(docType);

  /*
   * Les URL de blob sont créées UNE fois par fichier et révoquées au
   * changement. L'ancienne version les recréait à chaque rendu sans jamais les
   * libérer.
   */
  const [rectoUrl, setRectoUrl] = useState<string | null>(null);
  const [versoUrl, setVersoUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!rectoFile) return setRectoUrl(null);
    const url = URL.createObjectURL(rectoFile);
    setRectoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [rectoFile]);

  useEffect(() => {
    if (!versoFile) return setVersoUrl(null);
    const url = URL.createObjectURL(versoFile);
    setVersoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [versoFile]);

  useEffect(() => {
    if (!avatarFile) return setAvatarUrl(null);
    const url = URL.createObjectURL(avatarFile);
    setAvatarUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const previewRecto = rectoUrl ?? selectedDoc?.image ?? null;
  const previewVerso = versoUrl ?? selectedDoc?.image_verso ?? null;
  const previewAvatar =
    avatarUrl ?? profile?.avatar_url ?? profile?.avatar ?? null;

  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  const roleLabel = [
    roleLabelLong(profile?.role ?? ""),
    profile?.title?.name,
  ]
    .filter(Boolean)
    .join(" · ");

  const completionItems = [
    {
      label: "Prénom et nom",
      done: Boolean(profile?.first_name && profile?.last_name),
    },
    { label: "Date de naissance", done: Boolean(profile?.birth_date) },
    { label: "Genre", done: Boolean(profile?.gender) },
    {
      label: "Photo de profil",
      done: Boolean(profile?.avatar || profile?.avatar_url),
    },
    { label: "Pays de résidence", done: Boolean(profile?.residence_country) },
    {
      label: "Adresse complète",
      done: Boolean(profile?.address && profile?.city),
    },
    { label: "Pièce d'identité", done: documents.length > 0 },
  ];
  const completedCount = completionItems.filter((i) => i.done).length;
  const completionPct = Math.round(
    (completedCount / completionItems.length) * 100,
  );

  const handleSubmitProfile = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const rawData = new FormData(e.currentTarget);
    const firstName = rawData.get("first_name") as string;
    const lastName = rawData.get("last_name") as string;

    if (!firstName?.trim() || !lastName?.trim()) {
      toast.error("Le prénom et le nom sont obligatoires.");
      return;
    }

    const formData = new FormData();

    /* Une date vide est omise plutôt qu'envoyée en chaîne vide : le backend
       rejette `""` sur un DateField. Les autres champs acceptent le vide. */
    for (const [key, value] of Array.from(rawData.entries())) {
      if (key === "birth_date" && typeof value === "string" && !value.trim()) {
        continue;
      }
      formData.append(key, value);
    }

    if (avatarFile) formData.set("avatar", avatarFile);

    startTransition(async () => {
      const { error } = await updateProfile(formData);
      if (error) {
        toast.error(`Erreur : ${error}`);
        return;
      }
      setAvatarFile(null);
      router.refresh();
      toast.success("Profil mis à jour avec succès.");
    });
  };

  const handleRequestTitle = () => {
    if (!selectedTitleId) return;
    startTransition(async () => {
      const { error } = await submitTitleRequest(Number(selectedTitleId));
      if (error) {
        toast.error(error);
        return;
      }
      setSelectedTitleId("");
      router.refresh();
      toast.success("Demande de titre envoyée.");
    });
  };

  const handleUploadDocument = () => {
    if (!rectoFile || !profile?.id) {
      toast.error("Ajoutez au moins le recto du document.");
      return;
    }

    const payload = new FormData();
    payload.append("doc_type", docType);
    payload.append("image", rectoFile);
    if (versoFile) payload.append("image_verso", versoFile);
    if (docNumber.trim()) payload.append("doc_number", docNumber.trim());

    startTransition(async () => {
      const existing = docMap.get(docType);
      const result = existing
        ? await updateUserDocument(profile.id!, existing.id, payload)
        : await createUserDocument(profile.id!, payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const updated = result.data as UserDocument;
      setDocuments((prev) => [
        updated,
        ...prev.filter((d) => d.doc_type !== updated.doc_type),
      ]);
      setRectoFile(null);
      setVersoFile(null);
      setDocNumber("");
      toast.success("Document soumis avec succès.");
      router.refresh();
    });
  };

  /* Zone de dépôt d'une face du document. */
  const facePicker = (
    label: string,
    preview: string | null,
    onPick: (f: File | null) => void,
  ) => (
    <div className="ax-field">
      <span className="ax-field__label">{label}</span>
      <label className="ax-dropzone__area relative aspect-3/2 overflow-hidden p-0!">
        {preview ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="" className="h-full w-full object-cover" />
            <span className="ax-badge ax-badge--neutral ax-badge--sm absolute inset-e-2 top-2">
              Modifier
            </span>
          </>
        ) : (
          <>
            <IdCard aria-hidden="true" />
            <span className="text-xs">Choisir une image</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="ax-visually-hidden"
          onChange={(e) => onPick(guardSize(e))}
        />
      </label>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* ══ Rail de gauche ══ */}
      <div className="flex flex-col gap-4 lg:col-span-1">
        {/* Identité */}
        <section className="ax-card overflow-hidden">
          <CoverBand height={96} />

          <div className="ax-card__body -mt-12 flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <Avatar
                src={previewAvatar}
                name={fullName}
                size="2xl"
                className="ax-avatar--ringed"
              />
              <label
                className="ax-btn ax-btn--primary ax-btn--icon ax-btn--sm absolute inset-e-0 bottom-0 cursor-pointer"
                title="Changer la photo"
              >
                <Camera size={14} aria-hidden="true" />
                <span className="ax-visually-hidden">Changer la photo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="ax-visually-hidden"
                  onChange={(e) => setAvatarFile(guardSize(e))}
                />
              </label>
            </div>

            <div>
              <h2 className="ax-card__title">{fullName || "Sans nom"}</h2>
              <p className="ax-text-muted text-sm">{roleLabel}</p>
            </div>

            {avatarFile && (
              <span className="ax-badge ax-badge--warning ax-badge--sm">
                Photo modifiée — enregistrez pour valider
              </span>
            )}

            {profile?.daara_name && (
              <p className="ax-text-subtle text-xs">
                Daara :{" "}
                <span className="ax-text-strong">{profile.daara_name}</span>
              </p>
            )}
          </div>
        </section>

        {/* Complétion */}
        <section className="ax-card">
          <div className="ax-card__header">
            <div className="ax-card__titles">
              <h3 className="ax-card__title">Complétion du profil</h3>
            </div>
            <span className="ax-text-accent font-mono tabular text-lg font-semibold">
              {completionPct} %
            </span>
          </div>

          <div className="ax-card__body flex flex-col gap-4">
            <div
              className="ax-progress ax-progress--sm"
              role="progressbar"
              aria-valuenow={completionPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Complétion du profil"
            >
              <div className="ax-progress__track">
                <div
                  className="ax-progress__fill"
                  style={{ width: `${completionPct}%` }}
                />
              </div>
            </div>

            <ul className="ax-list ax-list--compact">
              {completionItems.map((item) => (
                <li key={item.label} className="ax-list__row px-0!">
                  <span
                    className={`ax-list__leading ax-badge ax-badge--sm ${
                      item.done ? "ax-badge--success" : "ax-badge--neutral"
                    }`}
                    aria-hidden="true"
                  >
                    {item.done ? <Check size={11} /> : <X size={11} />}
                  </span>
                  <span
                    className={`ax-list__content text-sm ${
                      item.done ? "" : "ax-text-subtle"
                    }`}
                  >
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Demande de titre */}
        <section className="ax-card">
          <div className="ax-card__header">
            <span className="ax-card__kpi-icon ax-card__kpi-icon--c4" aria-hidden="true">
              <BadgeCheck />
            </span>
            <div className="ax-card__titles">
              <h3 className="ax-card__title">Demande de titre</h3>
              <p className="ax-card__subtitle">
                Une seule modification autorisée.
              </p>
            </div>
          </div>

          <div className="ax-card__body flex flex-col gap-3">
            <div className="ax-field">
              <label className="ax-field__label" htmlFor="titleRequest">
                Titre honorifique
              </label>
              <select
                id="titleRequest"
                className="ax-select"
                value={selectedTitleId}
                onChange={(e) => setSelectedTitleId(e.target.value)}
              >
                <option value="">Sélectionner un titre…</option>
                {titles
                  .filter((t) => t.is_active !== false)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>

            <button
              type="button"
              className="ax-btn ax-btn--primary ax-btn--block"
              disabled={isPending || !selectedTitleId}
              onClick={handleRequestTitle}
            >
              <span className="ax-btn__label">Soumettre la demande</span>
            </button>
          </div>
        </section>
      </div>

      {/* ══ Panneaux ══ */}
      <div className="flex flex-col gap-4 lg:col-span-2">
        <div className="ax-tabs">
          <div className="ax-tabs__list" role="tablist">
            <button
              type="button"
              role="tab"
              className="ax-tabs__tab"
              aria-selected={tab === "infos"}
              onClick={() => setTab("infos")}
            >
              <UserRound className="ax-tabs__icon" size={15} aria-hidden="true" />
              Informations
            </button>
            <button
              type="button"
              role="tab"
              className="ax-tabs__tab"
              aria-selected={tab === "documents"}
              onClick={() => setTab("documents")}
            >
              <FileText className="ax-tabs__icon" size={15} aria-hidden="true" />
              Pièces d&apos;identité
              {documents.length > 0 && (
                <span className="ax-tabs__badge ax-badge ax-badge--count ax-badge--sm">
                  {documents.length}
                </span>
              )}
            </button>
            <button
              type="button"
              role="tab"
              className="ax-tabs__tab"
              aria-selected={tab === "security"}
              onClick={() => setTab("security")}
            >
              <ShieldCheck className="ax-tabs__icon" size={15} aria-hidden="true" />
              Sécurité
            </button>
          </div>
        </div>

        {/* ── Informations ── */}
        {tab === "infos" && (
          <section className="ax-card" role="tabpanel">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <h3 className="ax-card__title">Informations du compte</h3>
              </div>
            </div>

            <form className="ax-card__body flex flex-col gap-8" onSubmit={handleSubmitProfile}>
              {/* Identité */}
              <fieldset className="flex flex-col gap-4">
                <legend className="ax-eyebrow mb-2 flex items-center gap-2">
                  <UserRound size={13} aria-hidden="true" /> État civil
                </legend>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="first_name">
                      Prénom
                      <span className="ax-field__required" aria-hidden="true"> *</span>
                    </label>
                    <input
                      id="first_name"
                      name="first_name"
                      className="ax-input"
                      defaultValue={profile?.first_name ?? ""}
                      required
                    />
                  </div>
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="last_name">
                      Nom
                      <span className="ax-field__required" aria-hidden="true"> *</span>
                    </label>
                    <input
                      id="last_name"
                      name="last_name"
                      className="ax-input"
                      defaultValue={profile?.last_name ?? ""}
                      required
                    />
                  </div>
                  <div className="ax-field">
                    <label className="ax-field__label">Date de naissance</label>
                    <DatePicker
                      name="birth_date"
                      defaultValue={profile?.birth_date || ""}
                    />
                  </div>
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="gender">
                      Genre
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      className="ax-select"
                      defaultValue={profile?.gender ?? ""}
                    >
                      <option value="">Non renseigné</option>
                      <option value="male">Homme</option>
                      <option value="female">Femme</option>
                      <option value="other">Autre</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Contact */}
              <fieldset className="flex flex-col gap-4">
                <legend className="ax-eyebrow mb-2 flex items-center gap-2">
                  <Phone size={13} aria-hidden="true" /> Contact
                </legend>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="email">
                      E-mail
                    </label>
                    <input
                      id="email"
                      className="ax-input"
                      defaultValue={profile?.email ?? ""}
                      readOnly
                    />
                    <p className="ax-field__hint">
                      L&apos;e-mail identifie le compte et ne se modifie pas ici.
                    </p>
                  </div>
                  <div className="ax-field">
                    <PhoneNumberValidation
                      name="phone"
                      defaultValue={profile?.phone ?? ""}
                    />
                  </div>
                </div>
              </fieldset>

              {/* Localisation */}
              <fieldset className="flex flex-col gap-4">
                <legend className="ax-eyebrow mb-2 flex items-center gap-2">
                  <MapPin size={13} aria-hidden="true" /> Localisation
                </legend>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="residence_country">
                      Pays de résidence
                    </label>
                    <input
                      id="residence_country"
                      name="residence_country"
                      className="ax-input"
                      defaultValue={profile?.residence_country ?? ""}
                    />
                  </div>
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="city">
                      Ville
                    </label>
                    <input
                      id="city"
                      name="city"
                      className="ax-input"
                      defaultValue={profile?.city ?? ""}
                    />
                  </div>
                  <div className="ax-field sm:col-span-2">
                    <label className="ax-field__label" htmlFor="address">
                      Adresse complète
                    </label>
                    <input
                      id="address"
                      name="address"
                      className="ax-input"
                      defaultValue={profile?.address ?? ""}
                    />
                  </div>
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="state">
                      Région
                    </label>
                    <input
                      id="state"
                      name="state"
                      className="ax-input"
                      defaultValue={profile?.state ?? ""}
                    />
                  </div>
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="zip_code">
                      Code postal
                    </label>
                    <input
                      id="zip_code"
                      name="zip_code"
                      className="ax-input font-mono"
                      defaultValue={profile?.zip_code ?? ""}
                    />
                  </div>
                </div>
              </fieldset>

              {/* Complémentaire */}
              <fieldset className="flex flex-col gap-4">
                <legend className="ax-eyebrow mb-2 flex items-center gap-2">
                  <IdCard size={13} aria-hidden="true" /> Informations complémentaires
                </legend>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="marital_status">
                      Statut matrimonial
                    </label>
                    <select
                      id="marital_status"
                      name="marital_status"
                      className="ax-select"
                      defaultValue={profile?.marital_status ?? ""}
                    >
                      <option value="">Non renseigné</option>
                      <option value="single">Célibataire</option>
                      <option value="married">Marié(e)</option>
                    </select>
                  </div>
                  <div className="ax-field">
                    <label className="ax-field__label" htmlFor="blood_type">
                      Groupe sanguin
                    </label>
                    <select
                      id="blood_type"
                      name="blood_type"
                      className="ax-select"
                      defaultValue={profile?.blood_type ?? ""}
                    >
                      <option value="">Non renseigné</option>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                        (g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </fieldset>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="ax-btn ax-btn--primary ax-btn--lg"
                  disabled={isPending}
                >
                  <span className="ax-btn__label">
                    {isPending ? "Enregistrement…" : "Mettre à jour le profil"}
                  </span>
                </button>
              </div>
            </form>
          </section>
        )}

        {/* ── Pièces d'identité ── */}
        {tab === "documents" && (
          <section className="ax-card" role="tabpanel">
            <div className="ax-card__header">
              <div className="ax-card__titles">
                <h3 className="ax-card__title">Pièces d&apos;identité</h3>
                <p className="ax-card__subtitle">
                  Une pièce validée débloque l&apos;accès complet à la
                  plateforme.
                </p>
              </div>
              {selectedDoc && (
                <StatusBadge domain="document" value={selectedDoc.status} />
              )}
            </div>

            <div className="ax-card__body grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="docType">
                    Type de pièce
                  </label>
                  <select
                    id="docType"
                    className="ax-select"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                  >
                    {DOC_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ax-field">
                  <label className="ax-field__label" htmlFor="docNumber">
                    Numéro de pièce
                  </label>
                  <input
                    id="docNumber"
                    className="ax-input font-mono"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="123456789"
                  />
                </div>

                {selectedDoc?.status === "rejected" &&
                  selectedDoc.rejection_note && (
                    <div className="ax-alert ax-alert--danger">
                      <X className="ax-alert__icon" aria-hidden="true" />
                      <div className="ax-alert__content">
                        <p className="ax-alert__title">Document à corriger</p>
                        <p className="ax-alert__message">
                          {selectedDoc.rejection_note}
                        </p>
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  {facePicker("Recto", previewRecto, setRectoFile)}
                  {facePicker("Verso", previewVerso, setVersoFile)}
                </div>

                <button
                  type="button"
                  className="ax-btn ax-btn--primary ax-btn--block"
                  onClick={handleUploadDocument}
                  disabled={isPending || !rectoFile}
                >
                  <span className="ax-btn__label">
                    {isPending ? "Envoi…" : "Soumettre les fichiers"}
                  </span>
                </button>
                {!rectoFile && (
                  <p className="ax-field__hint text-center">
                    Le recto est obligatoire.
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ── Sécurité ── */}
        {tab === "security" && (
          <section className="ax-card" role="tabpanel">
            <CardHeader
              icon={ShieldCheck}
              tone="c2"
              title="Mot de passe"
              subtitle="Changez-le quand vous le souhaitez."
            />

            <div className="ax-card__body flex flex-col gap-6">
              {/*
                Le message n'est pas le même selon d'où vient le mot de passe.
                Quand il a été attribué par un tiers — création par un
                administrateur, inscription faite par un collecteur, import Excel
                — le changer n'est pas une précaution, c'est une réparation :
                d'autres personnes le connaissent déjà.
              */}
              {profile?.must_change_password ? (
                <div className="ax-alert ax-alert--danger ax-alert--inline">
                  <ShieldAlert className="ax-alert__icon" aria-hidden="true" />
                  <div className="ax-alert__content">
                    <p className="ax-alert__title">
                      Votre mot de passe vous a été attribué
                    </p>
                    <p className="ax-alert__message">
                      Il est connu d&apos;au moins une autre personne. Remplacez-le
                      par un mot de passe que vous êtes seul à connaître.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="ax-text-muted max-w-prose text-sm leading-relaxed">
                  Un mot de passe se change sans raison particulière — par
                  précaution, ou parce que quelqu&apos;un a pu le voir. Vous devrez
                  saisir l&apos;actuel pour confirmer que c&apos;est bien vous.
                </p>
              )}

              <div className="max-w-md">
                <PasswordChangeForm
                  formId="profile-password"
                  withSubmit
                  onSuccess={() => {
                    toast.success("Mot de passe modifié.");
                    router.refresh();
                  }}
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
