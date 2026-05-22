"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  updateProfile,
  submitTitleRequest,
  createUserDocument,
  updateUserDocument,
} from "@/app/actions/users";
import PhoneNumberValidation from "@/components/PhoneNumberValidation";
import { toast } from "sonner";

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

const DOC_TYPES = [
  { value: "national_id", label: "Carte nationale" },
  { value: "passport", label: "Passeport" },
  { value: "voter_id", label: "Carte d'électeur" },
  { value: "driver_license", label: "Permis" },
];

export function ProfileClient({
  profile,
  titles,
  initialDocuments,
}: {
  profile: any;
  titles: TitleOption[];
  initialDocuments: UserDocument[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
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
  const roleLabel = `${(profile?.role || "member").replaceAll("_", " ")} ${profile?.title?.name ? `. ${profile.title.name}` : ""}`;

  // Completion calculation
  const completionItems = [
    { label: "Prénom & Nom", done: !!profile?.first_name && !!profile?.last_name },
    { label: "Date de naissance", done: !!profile?.birth_date },
    { label: "Genre", done: !!profile?.gender },
    { label: "Photo de profil", done: !!profile?.avatar || !!profile?.avatar_url },
    { label: "Pays de résidence", done: !!profile?.residence_country },
    { label: "Adresse complète", done: !!profile?.address && !!profile?.city },
    { label: "Documents d'identité", done: documents.length > 0 },
  ];
  const completedCount = completionItems.filter(i => i.done).length;
  const completionPercentage = Math.round((completedCount / completionItems.length) * 100);

  const refreshProfile = async () => {
    router.refresh();
  };

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

    // Clean up empty strings ONLY for date fields to ensure backend validation passes
    // Other fields can be sent as empty strings if they are allowed to be blank
    for (const [key, value] of Array.from(rawData.entries())) {
      if (key === "birth_date" && typeof value === "string" && value.trim() === "") {
        continue;
      }
      formData.append(key, value);
    }

    if (avatarFile) {
      formData.set("avatar", avatarFile);
    }

    startTransition(async () => {
      const { error } = await updateProfile(formData);
      if (error) {
        toast.error("Erreur : " + error);
        return;
      }
      setAvatarFile(null);
      await refreshProfile();
      toast.success("Profil mis à jour avec succès !");
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
      await refreshProfile();
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
        ? await updateUserDocument(profile.id, existing.id, payload)
        : await createUserDocument(profile.id, payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const updated = result.data as UserDocument;
      setDocuments((prev) => {
        const rest = prev.filter((d) => d.doc_type !== updated.doc_type);
        return [updated, ...rest];
      });
      setRectoFile(null);
      setVersoFile(null);
      setDocNumber("");
      toast.success("Document soumis avec succès !");
      await refreshProfile();
    });
  };

  const previewRecto = rectoFile
    ? URL.createObjectURL(rectoFile)
    : selectedDoc?.image;
  const previewVerso = versoFile
    ? URL.createObjectURL(versoFile)
    : selectedDoc?.image_verso;
  
  const previewAvatar = avatarFile 
    ? URL.createObjectURL(avatarFile) 
    : (profile?.avatar_url || profile?.avatar);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20 max-w-7xl mx-auto px-4 lg:px-0">
      <div className="lg:col-span-1 space-y-6">
        {/* Avatar Card */}
        <div
          className="bg-card p-6 rounded-xl border shadow-sm relative overflow-hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex flex-col items-center text-center gap-4 relative z-10">
            <div className="relative group cursor-pointer">
              <Avatar className="h-32 w-32 border-4 border-background shadow-sm transition-transform hover:scale-[1.02]">
                <AvatarImage
                  src={previewAvatar}
                  className="object-cover"
                />
                <AvatarFallback className="bg-yessal-violet text-white text-3xl font-semibold">
                  {profile?.first_name?.[0]}
                  {profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                />
                <span className="text-[11px] font-medium uppercase tracking-wider">Changer</span>
              </label>
            </div>
            <div>
              <h3 className="text-xl font-semibold tracking-tight">
                {profile?.first_name} {profile?.last_name}
              </h3>
              <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground mt-1">
                {roleLabel}
              </p>
            </div>
            <div className="w-full h-px bg-muted/60 my-2" />
            <div className="w-full space-y-2 text-sm">
               <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Daara</span>
                  <span className="font-semibold text-yessal-violet">{profile?.daara_name || "Non renseigné"}</span>
               </div>
            </div>
          </div>
        </div>

        {/* Completion Progress Card */}
        <div
          className="bg-card p-6 rounded-xl border shadow-sm space-y-4"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex justify-between items-end">
            <h4 className="font-semibold text-[11px] uppercase tracking-widest text-muted-foreground">Complétion du profil</h4>
            <span className="text-xl font-semibold text-yessal-violet">{completionPercentage}%</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-yessal-violet transition-all duration-1000 ease-out" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="space-y-2.5 pt-2">
            {completionItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-[13px]">
                <div className={`size-4 rounded-full flex items-center justify-center ${item.done ? 'bg-yessal-violet text-white' : 'bg-muted/50 text-muted-foreground'}`}>
                  {item.done ? <span className="text-[10px]">✓</span> : <span className="text-[10px]">×</span>}
                </div>
                <span className={item.done ? 'text-foreground font-medium' : 'text-muted-foreground font-normal'}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Title Request Card */}
        <div
          className="bg-card p-6 rounded-xl border shadow-sm space-y-4"
          style={{ borderColor: "var(--border)" }}
        >
          <h4 className="font-semibold text-[11px] uppercase tracking-widest text-muted-foreground">Demande de titre</h4>
          <select
            value={selectedTitleId}
            onChange={(e) => setSelectedTitleId(e.target.value)}
            className="flex h-11 w-full rounded-lg border bg-background px-4 py-2 text-sm font-medium focus:ring-1 focus:ring-yessal-violet outline-none transition-all"
            style={{ borderColor: "var(--border)" }}
          >
            <option value="">Sélectionner un titre</option>
            {titles
              .filter((t) => t.is_active !== false)
              .map((title) => (
                <option key={title.id} value={title.id}>
                  {title.name}
                </option>
              ))}
          </select>
          <Button
            type="button"
            disabled={isPending || !selectedTitleId}
            onClick={handleRequestTitle}
            className="w-full h-11 rounded-lg bg-yessal-violet text-white font-semibold uppercase tracking-widest text-[11px] hover:opacity-90 transition-all"
          >
            Soumettre la demande
          </Button>
          <p className="text-[10px] text-center text-muted-foreground font-normal">
            Une seule modification de titre est autorisée.
          </p>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-8">
        {/* Account Info Form */}
        <div
          className="bg-card p-8 rounded-xl border shadow-sm"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-semibold tracking-tight">Informations du compte</h3>
            {avatarFile && (
              <Badge variant="outline" className="text-orange-600 border-orange-200 font-medium">Photo modifiée</Badge>
            )}
          </div>
          
          <form className="space-y-8" onSubmit={handleSubmitProfile}>
            {/* Identity Group */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <span className="h-px w-4 bg-muted" /> Identité personnelle
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Prénom</Label>
                  <Input
                    name="first_name"
                    defaultValue={profile?.first_name || ""}
                    className="h-11 rounded-lg bg-muted/10 border-transparent focus:border-yessal-violet focus:bg-background transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Nom</Label>
                  <Input
                    name="last_name"
                    defaultValue={profile?.last_name || ""}
                    className="h-11 rounded-lg bg-muted/10 border-transparent focus:border-yessal-violet focus:bg-background transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Date de naissance</Label>
                  <Input
                    name="birth_date"
                    type="date"
                    defaultValue={profile?.birth_date || ""}
                    className="h-11 rounded-lg bg-muted/10 border-transparent focus:border-yessal-violet focus:bg-background transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Genre</Label>
                  <select
                    name="gender"
                    defaultValue={profile?.gender || ""}
                    className="flex h-11 w-full rounded-lg border-transparent bg-muted/10 px-4 py-2 text-sm font-medium focus:border-yessal-violet focus:bg-background transition-all outline-none"
                  >
                    <option value="">Sélectionner</option>
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Contact Group */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <span className="h-px w-4 bg-muted" /> Contact & Réseaux
              </h4>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Email (Lecture seule)</Label>
                  <Input
                    defaultValue={profile?.email || ""}
                    readOnly
                    className="h-11 rounded-lg bg-muted/20 border-transparent font-medium cursor-not-allowed opacity-70"
                  />
                </div>
                <div className="space-y-2">
                  <PhoneNumberValidation
                    name="phone"
                    defaultValue={profile?.phone?.replace("+", "") || "221"}
                  />
                </div>
              </div>
            </div>

            {/* Address Group */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <span className="h-px w-4 bg-muted" /> Résidence & Localisation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Pays de résidence</Label>
                  <Input
                    name="residence_country"
                    defaultValue={profile?.residence_country || ""}
                    placeholder="Ex: Sénégal"
                    className="h-11 rounded-lg bg-muted/10 border-transparent focus:border-yessal-violet focus:bg-background transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Ville</Label>
                  <Input
                    name="city"
                    defaultValue={profile?.city || ""}
                    placeholder="Ex: Dakar"
                    className="h-11 rounded-lg bg-muted/10 border-transparent focus:border-yessal-violet focus:bg-background transition-all font-medium"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Adresse complète</Label>
                  <Input
                    name="address"
                    defaultValue={profile?.address || ""}
                    placeholder="Ex: Rue 10, Médina"
                    className="h-11 rounded-lg bg-muted/10 border-transparent focus:border-yessal-violet focus:bg-background transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Région / État</Label>
                  <Input
                    name="state"
                    defaultValue={profile?.state || ""}
                    className="h-11 rounded-lg bg-muted/10 border-transparent focus:border-yessal-violet focus:bg-background transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Code Postal</Label>
                  <Input
                    name="zip_code"
                    defaultValue={profile?.zip_code || ""}
                    className="h-11 rounded-lg bg-muted/10 border-transparent focus:border-yessal-violet focus:bg-background transition-all font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Other Info Group */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <span className="h-px w-4 bg-muted" /> Informations complémentaires
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Statut matrimonial</Label>
                  <select
                    name="marital_status"
                    defaultValue={profile?.marital_status || ""}
                    className="flex h-11 w-full rounded-lg border-transparent bg-muted/10 px-4 py-2 text-sm font-medium focus:border-yessal-violet focus:bg-background transition-all outline-none"
                  >
                    <option value="">Sélectionner</option>
                    <option value="single">Célibataire</option>
                    <option value="married">Marié(e)</option>
                    <option value="divorced">Divorcé(e)</option>
                    <option value="widowed">Veuf/Veuve</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Groupe sanguin</Label>
                  <select
                    name="blood_type"
                    defaultValue={profile?.blood_type || ""}
                    className="flex h-11 w-full rounded-lg border-transparent bg-muted/10 px-4 py-2 text-sm font-medium focus:border-yessal-violet focus:bg-background transition-all outline-none"
                  >
                    <option value="">Sélectionner</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <Button
                disabled={isPending}
                className="h-11 px-10 rounded-lg bg-yessal-violet text-white font-semibold uppercase tracking-widest text-[11px] hover:opacity-90 transition-all active:scale-[0.98]"
              >
                {isPending ? "Enregistrement..." : "Mettre à jour le profil"}
              </Button>
            </div>
          </form>
        </div>

        {/* Identity Documents Section */}
        <div
          className="bg-card p-8 rounded-xl border shadow-sm"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-semibold tracking-tight">Pièces d'identité</h3>
            <Badge variant="secondary" className="font-medium text-[10px]">Vérification requise</Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Type de pièce</Label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="flex h-11 w-full rounded-lg border-transparent bg-muted/10 px-4 py-2 text-sm font-medium focus:border-yessal-violet focus:bg-background transition-all outline-none"
                >
                  {DOC_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground ml-1">Numéro de pièce</Label>
                <Input
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="Ex: 123456789"
                  className="h-11 rounded-lg bg-muted/10 border-transparent focus:border-yessal-violet focus:bg-background transition-all font-medium"
                />
              </div>
              
              <div className="pt-2">
                 {selectedDoc && (
                  <div className={`p-4 rounded-lg flex items-center justify-between ${
                    selectedDoc.status === 'validated' ? 'bg-green-50/50 text-green-700 border border-green-100' :
                    selectedDoc.status === 'rejected' ? 'bg-red-50/50 text-red-700 border border-red-100' :
                    'bg-orange-50/50 text-orange-700 border border-orange-100'
                  }`}>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-semibold uppercase tracking-widest opacity-70">Statut actuel</span>
                      <span className="font-semibold text-[13px] uppercase">{
                        selectedDoc.status === 'validated' ? 'Validé' :
                        selectedDoc.status === 'rejected' ? 'Rejeté' :
                        'En attente'
                      }</span>
                    </div>
                    {selectedDoc.status === "rejected" && selectedDoc.rejection_note && (
                      <p className="text-[11px] font-medium mt-1 text-red-600 max-w-[150px]">{selectedDoc.rejection_note}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-widest text-center block text-muted-foreground">Recto</Label>
                  <div className="relative aspect-[3/2] rounded-lg border border-dashed border-muted overflow-hidden group">
                    <img
                      src={previewRecto || "/placeholder-doc.png"}
                      className={`w-full h-full object-cover transition-opacity ${!previewRecto && 'opacity-10'}`}
                      alt="Recto"
                    />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => setRectoFile(e.target.files?.[0] || null)}
                      />
                      <span className="text-[11px] font-medium uppercase tracking-wider">Modifier</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-semibold uppercase tracking-widest text-center block text-muted-foreground">Verso</Label>
                  <div className="relative aspect-[3/2] rounded-lg border border-dashed border-muted overflow-hidden group">
                    <img
                      src={previewVerso || "/placeholder-doc.png"}
                      className={`w-full h-full object-cover transition-opacity ${!previewVerso && 'opacity-10'}`}
                      alt="Verso"
                    />
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => setVersoFile(e.target.files?.[0] || null)}
                      />
                      <span className="text-[11px] font-medium uppercase tracking-wider">Modifier</span>
                    </label>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleUploadDocument}
                disabled={isPending || !rectoFile}
                className="w-full h-11 rounded-lg bg-yessal-violet text-white font-semibold uppercase tracking-widest text-[11px] hover:opacity-90 transition-all mt-4"
              >
                Soumettre les fichiers
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
