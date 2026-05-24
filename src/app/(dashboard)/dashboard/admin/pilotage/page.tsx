"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  createTitle,
  deleteTitle,
  getPendingDocuments,
  getPilotageSettings,
  getTitleRequests,
  getTitles,
  reviewTitleRequest,
  updatePilotageSettings,
  validateDocument,
} from "@/app/actions/users";
import {
  confirmWireDonation,
  createDonationArchive,
  getArchiveDonations,
  getPendingWireDonations,
  listDonationArchives,
} from "@/app/actions/donations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExportButton } from "@/components/ExportButton";
import { Loader2, Save, Settings } from "lucide-react";
import { toast } from "sonner";

type PilotageSettings = { enable_salons: boolean };
type Title = {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
};
type TitleRequest = {
  id: number;
  member_name?: string;
  title_name?: string;
  status: string;
  created_at: string;
};
type UserDocument = {
  id: number;
  user?: number;
  doc_type: string;
  image?: string;
  image_verso?: string;
  status: string;
  rejection_note?: string;
};
type Donation = {
  id: number;
  donor_name?: string;
  donor_daara_name?: string;
  campaign_name?: string;
  collector_name?: string;
  beneficiary_name?: string;
  amount: number | string;
  payment_method?: string;
  payment_status: string;
  wire_reference?: string;
  is_anonymous?: boolean;
  created_at: string;
};
type Archive = {
  id: number;
  name: string;
  total_count: number;
  total_amount: number;
  created_at: string;
};

export default function PilotagePage() {
  const [settings, setSettings] = useState<PilotageSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [titles, setTitles] = useState<Title[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [titleRequests, setTitleRequests] = useState<TitleRequest[]>([]);

  const [pendingDocs, setPendingDocs] = useState<UserDocument[]>([]);
  const [pendingWires, setPendingWires] = useState<Donation[]>([]);

  const [archives, setArchives] = useState<Archive[]>([]);
  const [archiveName, setArchiveName] = useState("");
  const [archiveDescription, setArchiveDescription] = useState("");
  const [archiveDetails, setArchiveDetails] = useState<Donation[]>([]);
  const [selectedArchiveId, setSelectedArchiveId] = useState<number | null>(
    null,
  );
  const [selectedDocForLightbox, setSelectedDocForLightbox] = useState<UserDocument | null>(null);


  const loadAll = async () => {
    setIsLoading(true);
    const [s, t, tr, pd, pw, ar] = await Promise.all([
      getPilotageSettings(),
      getTitles(),
      getTitleRequests(),
      getPendingDocuments(),
      getPendingWireDonations(),
      listDonationArchives(),
    ]);
    if (s.data) setSettings(s.data);
    setTitles(t.data || []);
    setTitleRequests(
      (tr.data || []).filter((x: TitleRequest) => x.status === "pending"),
    );
    setPendingDocs(pd.data || []);
    setPendingWires(pw.data || []);
    setArchives(ar.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const handleSaveSettings = () => {
    if (!settings) return;
    startTransition(async () => {
      const { error } = await updatePilotageSettings(settings);
      if (error) { toast.error(error); return; }
      toast.success("Paramètres enregistrés.");
    });
  };

  const handleCreateTitle = () => {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      const res = await createTitle({ name: newTitle.trim(), is_active: true });
      if (res.error) { toast.error(res.error); return; }
      setNewTitle("");
      await loadAll();
      toast.success("Titre créé.");
    });
  };

  const handleDeleteTitle = (id: number) => {
    if (!confirm("Supprimer ce titre ?")) return;
    startTransition(async () => {
      const res = await deleteTitle(id);
      if (res.error) { toast.error(res.error); return; }
      await loadAll();
      toast.success("Titre supprimé.");
    });
  };

  const handleReviewTitle = (id: number, action: "approve" | "refuse") => {
    const note = action === "refuse" ? (window.prompt("Note de refus (optionnel)") || "") : "";
    startTransition(async () => {
      const res = await reviewTitleRequest(id, action, note);
      if (res.error) { toast.error(res.error); return; }
      await loadAll();
      toast.success(action === "approve" ? "Demande approuvée." : "Demande refusée.");
    });
  };

  const handleValidateDocument = (id: number, accept: boolean) => {
    const status = accept ? "validated" : "rejected";
    const note = accept ? "" : (window.prompt("Note de rejet") || "");
    startTransition(async () => {
      const res = await validateDocument(id, status, note);
      if (res.error) { toast.error(res.error); return; }
      await loadAll();
      toast.success(accept ? "Document validé." : "Document rejeté.");
    });
  };

  const handleConfirmWire = (id: number) => {
    startTransition(async () => {
      const res = await confirmWireDonation(id);
      if (res.error) { toast.error(res.error); return; }
      await loadAll();
      toast.success("Virement confirmé.");
    });
  };

  const handleCreateArchive = () => {
    if (!archiveName.trim()) {
      toast.error("Nom d'archive requis.");
      return;
    }
    startTransition(async () => {
      const res = await createDonationArchive(archiveName.trim(), archiveDescription.trim());
      if (res.error) { toast.error(res.error); return; }
      setArchiveName("");
      setArchiveDescription("");
      await loadAll();
      toast.success("Archive créée.");
    });
  };

  const handleOpenArchive = (id: number) => {
    setSelectedArchiveId(id);
    startTransition(async () => {
      const res = await getArchiveDonations(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setArchiveDetails(res.data || []);
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-yessal-violet" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="text-yessal-violet" /> Pilotage du systeme
        </h1>
        <Button
          onClick={handleSaveSettings}
          disabled={isPending}
          className="bg-yessal-violet text-white gap-2"
        >
          {isPending ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <Save size={16} />
          )}
          Enregistrer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Messagerie</CardTitle>
          <CardDescription>Activation des salons.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <Label>Activer les salons de discussion</Label>
          <Switch
            checked={settings?.enable_salons ?? false}
            onCheckedChange={(val) => setSettings({ enable_salons: val })}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Virements en attente</CardTitle>
            <CardDescription>Confirmer la reception bancaire.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingWires.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun virement en attente.
              </p>
            ) : (
              pendingWires.map((wire) => (
                <div
                  key={wire.id}
                  className="border rounded-lg p-3 text-sm space-y-2 hover:bg-muted/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">JEF-{wire.id}</span>
                    <span className="font-bold text-yessal-green">{Number(wire.amount || 0).toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 text-xs text-muted-foreground">
                    <span><span className="font-semibold text-foreground">Donateur:</span> {wire.is_anonymous ? "Anonyme" : (wire.donor_name || "—")}</span>
                    <span><span className="font-semibold text-foreground">Daara:</span> {wire.donor_daara_name || "—"}</span>
                    <span><span className="font-semibold text-foreground">Réf. banc.:</span> {wire.wire_reference || "—"}</span>
                    <span><span className="font-semibold text-foreground">Campagne:</span> {wire.campaign_name || "—"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(wire.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                  <Button size="sm" className="bg-green-600 text-white h-7" onClick={() => handleConfirmWire(wire.id)} disabled={isPending}>
                    Confirmer réception
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Archives des Jefs</CardTitle>
            <CardDescription>
              Creer et consulter les archives de dons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                value={archiveName}
                onChange={(e) => setArchiveName(e.target.value)}
                placeholder="Nom de l'archive"
              />
              <Input
                value={archiveDescription}
                onChange={(e) => setArchiveDescription(e.target.value)}
                placeholder="Description (optionnel)"
              />
              <Button onClick={handleCreateArchive} disabled={isPending}>
                Creer une archive des Jefs
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto border-t pt-3">
              {archives.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="w-full text-left border rounded-md p-2 hover:bg-muted/20"
                  onClick={() => handleOpenArchive(a.id)}
                >
                  <div className="text-sm font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString("fr-FR")} -{" "}
                    {a.total_count} dons -{" "}
                    {Number(a.total_amount).toLocaleString()} FCFA
                  </div>
                </button>
              ))}
            </div>

            {selectedArchiveId && (
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    Détail archive #{selectedArchiveId}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {archiveDetails.length} jefs · {archiveDetails.reduce((s, d) => s + Number(d.amount || 0), 0).toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                  {archiveDetails.length > 0 && (
                    <ExportButton
                      data={archiveDetails.map((d) => ({
                        Ref: `JEF-${d.id}`,
                        Donateur: d.is_anonymous ? "Anonyme" : (d.donor_name || "-"),
                        Daara: d.donor_daara_name || "-",
                        Campagne: d.campaign_name || "-",
                        Collecteur: d.collector_name || "-",
                        Methode: d.payment_method || "-",
                        Montant_FCFA: Number(d.amount || 0),
                        Statut: (d.payment_status || "").toUpperCase(),
                        Reference_bancaire: d.wire_reference || "-",
                        Date: new Date(d.created_at).toLocaleDateString("fr-FR"),
                      }))}
                      filename={`archive-${selectedArchiveId}-jefs`}
                      label="Exporter CSV"
                      format="csv"
                      variant="outline"
                    />
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto border rounded-md">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40 sticky top-0">
                      <tr>
                        <th className="px-2 py-2 text-left font-bold">Ref</th>
                        <th className="px-2 py-2 text-left font-bold">Donateur</th>
                        <th className="px-2 py-2 text-left font-bold">Daara</th>
                        <th className="px-2 py-2 text-left font-bold">Campagne</th>
                        <th className="px-2 py-2 text-left font-bold">Méthode</th>
                        <th className="px-2 py-2 text-right font-bold">Montant</th>
                        <th className="px-2 py-2 text-right font-bold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archiveDetails.map((d) => (
                        <tr key={d.id} className="border-t hover:bg-muted/10">
                          <td className="px-2 py-2 font-mono text-[10px] text-muted-foreground">JEF-{d.id}</td>
                          <td className="px-2 py-2 font-medium">{d.is_anonymous ? "Anonyme" : (d.donor_name || "—")}</td>
                          <td className="px-2 py-2 text-muted-foreground">{d.donor_daara_name || "—"}</td>
                          <td className="px-2 py-2 text-muted-foreground">{d.campaign_name || "—"}</td>
                          <td className="px-2 py-2">
                            <span className="capitalize">{(d.payment_method || "—").replace("_", " ")}</span>
                          </td>
                          <td className="px-2 py-2 text-right font-bold text-yessal-green">
                            {Number(d.amount || 0).toLocaleString("fr-FR")}
                          </td>
                          <td className="px-2 py-2 text-right text-muted-foreground">
                            {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Titles management */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gestion des Titres honorifiques</CardTitle>
            <CardDescription>Créez les titres attribuables aux membres.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nouveau titre (ex: Serigne, Mame...)"
                onKeyDown={(e) => e.key === "Enter" && handleCreateTitle()}
              />
              <Button onClick={handleCreateTitle} disabled={isPending || !newTitle.trim()}>
                Ajouter
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto border-t pt-3">
              {titles.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">Aucun titre enregistré.</p>
              ) : (
                titles.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/10">
                    <span className="text-sm font-medium">{t.name}</span>
                    <Button size="sm" variant="ghost" className="text-red-600 h-7" onClick={() => handleDeleteTitle(t.id)} disabled={isPending}>
                      Supprimer
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Demandes de titres
              {titleRequests.length > 0 && (
                <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">{titleRequests.length} en attente</span>
              )}
            </CardTitle>
            <CardDescription>Approuvez ou refusez les demandes en attente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {titleRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Aucune demande en attente.</p>
            ) : (
              titleRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="text-sm font-bold">{req.member_name}</div>
                    <div className="text-xs text-muted-foreground">{req.title_name}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 text-white h-7" onClick={() => handleReviewTitle(req.id, "approve")} disabled={isPending}>
                      Approuver
                    </Button>
                    <Button size="sm" variant="outline" className="border-red-300 text-red-600 h-7" onClick={() => handleReviewTitle(req.id, "refuse")} disabled={isPending}>
                      Refuser
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document validation */}
      <Card>
        <CardHeader>
          <CardTitle>
            Validation des Documents d&apos;identité
            {pendingDocs.length > 0 && (
              <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">{pendingDocs.length} en attente</span>
            )}
          </CardTitle>
          <CardDescription>Vérifiez et validez les pièces d&apos;identité soumises.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Aucun document en attente de validation.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingDocs.map((doc) => (
                <div key={doc.id} className="border rounded-xl p-4 space-y-3 hover:border-yessal-violet/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold uppercase">{doc.doc_type.replace("_", " ")}</div>
                    <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase">En attente</span>
                  </div>
                  {doc.image && (
                    <button type="button" onClick={() => setSelectedDocForLightbox(doc)} className="w-full">
                      <img src={doc.image} alt="Recto" className="w-full h-32 object-cover rounded-lg border hover:opacity-90 transition-opacity cursor-zoom-in" />
                    </button>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-green-600 text-white" onClick={() => handleValidateDocument(doc.id, true)} disabled={isPending}>
                      Valider
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 border-red-300 text-red-600" onClick={() => handleValidateDocument(doc.id, false)} disabled={isPending}>
                      Rejeter
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document lightbox */}
      <Dialog open={!!selectedDocForLightbox} onOpenChange={(o) => !o && setSelectedDocForLightbox(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Document — {selectedDocForLightbox?.doc_type?.replace("_", " ")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            {selectedDocForLightbox?.image && (
              <div>
                <p className="text-[10px] font-black uppercase mb-2 text-muted-foreground">Recto</p>
                <img src={selectedDocForLightbox.image} alt="Recto" className="w-full rounded-xl border" />
              </div>
            )}
            {selectedDocForLightbox?.image_verso && (
              <div>
                <p className="text-[10px] font-black uppercase mb-2 text-muted-foreground">Verso</p>
                <img src={selectedDocForLightbox.image_verso} alt="Verso" className="w-full rounded-xl border" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
