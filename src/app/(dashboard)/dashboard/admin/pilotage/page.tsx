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
import { Eye, Loader2, Save, Settings } from "lucide-react";

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
  amount: number;
  wire_reference?: string;
  created_at: string;
  payment_status: string;
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

  const pendingTitleCount = useMemo(
    () => titleRequests.filter((r) => r.status === "pending").length,
    [titleRequests],
  );
  const pendingDocCount = pendingDocs.length;

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
      if (error) {
        alert(error);
        return;
      }
      alert("Parametres enregistres.");
    });
  };

  const handleCreateTitle = () => {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      const res = await createTitle({ name: newTitle.trim(), is_active: true });
      if (res.error) {
        alert(res.error);
        return;
      }
      setNewTitle("");
      await loadAll();
    });
  };

  const handleDeleteTitle = (id: number) => {
    startTransition(async () => {
      const res = await deleteTitle(id);
      if (res.error) {
        alert(res.error);
        return;
      }
      await loadAll();
    });
  };

  const handleReviewTitle = (id: number, action: "approve" | "refuse") => {
    const note =
      action === "refuse" ? prompt("Note de refus (optionnel)") || "" : "";
    startTransition(async () => {
      const res = await reviewTitleRequest(id, action, note);
      if (res.error) {
        alert(res.error);
        return;
      }
      await loadAll();
    });
  };

  const handleValidateDocument = (id: number, accept: boolean) => {
    const status = accept ? "validated" : "rejected";
    const note = accept ? "" : prompt("Note de rejet") || "";
    startTransition(async () => {
      const res = await validateDocument(id, status, note);
      if (res.error) {
        alert(res.error);
        return;
      }
      await loadAll();
    });
  };

  const handleConfirmWire = (id: number) => {
    startTransition(async () => {
      const res = await confirmWireDonation(id);
      if (res.error) {
        alert(res.error);
        return;
      }
      await loadAll();
    });
  };

  const handleCreateArchive = () => {
    if (!archiveName.trim()) {
      alert("Nom d'archive requis");
      return;
    }
    startTransition(async () => {
      const res = await createDonationArchive(
        archiveName.trim(),
        archiveDescription.trim(),
      );
      if (res.error) {
        alert(res.error);
        return;
      }
      setArchiveName("");
      setArchiveDescription("");
      await loadAll();
      alert("Archive creee.");
    });
  };

  const handleOpenArchive = (id: number) => {
    setSelectedArchiveId(id);
    startTransition(async () => {
      const res = await getArchiveDonations(id);
      if (res.error) {
        alert(res.error);
        return;
      }
      setArchiveDetails(res.data || []);
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin text-yessal-green" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="text-yessal-green" /> Pilotage du systeme
        </h1>
        <Button
          onClick={handleSaveSettings}
          disabled={isPending}
          className="bg-yessal-green text-white gap-2"
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
            <CardTitle>Titres membres</CardTitle>
            <CardDescription>
              Referentiel de titres + demandes en attente ({pendingTitleCount}).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Nouveau titre"
              />
              <Button onClick={handleCreateTitle} disabled={isPending}>
                Ajouter
              </Button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto">
              {titles.map((title) => (
                <div
                  key={title.id}
                  className="flex items-center justify-between border rounded-md p-2"
                >
                  <div className="text-sm font-medium">{title.name}</div>
                  <Button
                    variant="ghost"
                    className="text-red-600"
                    onClick={() => handleDeleteTitle(title.id)}
                  >
                    Supprimer
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t pt-4">
              <h4 className="text-sm font-semibold">Demandes de titre</h4>
              {titleRequests.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aucune demande en attente.
                </p>
              ) : (
                titleRequests.map((req) => (
                  <div
                    key={req.id}
                    className="border rounded-md p-3 text-xs space-y-2"
                  >
                    <div>
                      {req.member_name || "Membre"} demande &quot;
                      {req.title_name || "Titre"}&quot;
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReviewTitle(req.id, "approve")}
                      >
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReviewTitle(req.id, "refuse")}
                      >
                        Refuser
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents membres</CardTitle>
            <CardDescription>
              Validation des documents soumis ({pendingDocCount}).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[520px] overflow-y-auto">
            {pendingDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun document en attente.
              </p>
            ) : (
              pendingDocs.map((doc) => (
                <div key={doc.id} className="border rounded-md p-3 space-y-3">
                  <div className="text-xs font-medium">
                    {doc.doc_type} - user #{doc.user}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={doc.image}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs underline"
                    >
                      Recto
                    </a>
                    {doc.image_verso ? (
                      <a
                        href={doc.image_verso}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs underline"
                      >
                        Verso
                      </a>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Pas de verso
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="bg-yessal-green text-white"
                      onClick={() => setSelectedDocForLightbox(doc)}
                    >
                      <Eye size={14} className="mr-1" /> Inspecter
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleValidateDocument(doc.id, true)}
                    >
                      Vite valider
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleValidateDocument(doc.id, false)}
                    >
                      Rejeter
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

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
                  className="border rounded-md p-3 text-sm space-y-2"
                >
                  <div className="font-semibold">
                    REF-{wire.id} - {Number(wire.amount || 0).toLocaleString()}{" "}
                    FCFA
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {wire.donor_name || "Membre"} - ref:{" "}
                    {wire.wire_reference || "-"}
                  </div>
                  <Button size="sm" onClick={() => handleConfirmWire(wire.id)}>
                    Confirmer reception
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
                    {new Date(a.created_at).toLocaleDateString()} -{" "}
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
                    Detail archive #{selectedArchiveId}
                  </div>
                  {archiveDetails.length > 0 && (
                    <ExportButton
                      data={archiveDetails.map((d) => ({
                        Ref: `REF-${d.id}`,
                        Contributeur: d.donor_name || "-",
                        Montant: Number(d.amount || 0),
                        Statut: (d.payment_status || "").toUpperCase(),
                        Date: new Date(d.created_at).toLocaleDateString(
                          "fr-FR",
                        ),
                      }))}
                      filename={`archive-${selectedArchiveId}-jefs`}
                      label="Exporter CSV"
                      format="csv"
                      variant="outline"
                    />
                  )}
                </div>
                <div className="max-h-44 overflow-y-auto border rounded-md">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="px-2 py-2 text-left">Ref</th>
                        <th className="px-2 py-2 text-left">Contributeur</th>
                        <th className="px-2 py-2 text-left">Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {archiveDetails.map((d) => (
                        <tr key={d.id} className="border-t">
                          <td className="px-2 py-2">REF-{d.id}</td>
                          <td className="px-2 py-2">{d.donor_name || "-"}</td>
                          <td className="px-2 py-2">
                            {Number(d.amount).toLocaleString()} FCFA
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
      <Dialog open={!!selectedDocForLightbox} onOpenChange={() => setSelectedDocForLightbox(null)}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>Validation Document - {selectedDocForLightbox?.doc_type}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div className="space-y-2">
              <p className="text-sm font-bold text-center">Recto</p>
              <div className="aspect-[4/3] bg-muted rounded-xl overflow-hidden border relative">
                <img 
                  src={selectedDocForLightbox?.image} 
                  className="w-full h-full object-contain" 
                  alt="Recto"
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-bold text-center">Verso</p>
              <div className="aspect-[4/3] bg-muted rounded-xl overflow-hidden border relative">
                {selectedDocForLightbox?.image_verso ? (
                  <img 
                    src={selectedDocForLightbox?.image_verso} 
                    className="w-full h-full object-contain" 
                    alt="Verso"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    Pas d'image verso fournie
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedDocForLightbox) {
                  handleValidateDocument(selectedDocForLightbox.id, false);
                  setSelectedDocForLightbox(null);
                }
              }}
            >
              Rejeter
            </Button>
            <Button
              className="bg-yessal-green text-white"
              onClick={() => {
                if (selectedDocForLightbox) {
                  handleValidateDocument(selectedDocForLightbox.id, true);
                  setSelectedDocForLightbox(null);
                }
              }}
            >
              Valider le document
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
