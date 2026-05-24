"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  Wallet,
  HandCoins,
  Edit,
  ShieldAlert,
  ShieldCheck,
  MoreVertical,
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
  CreditCard,
  Users,
  ExternalLink,
  BookOpen,
  Layers,
  Hash,
} from "lucide-react";
import AppAreaChart from "@/components/AppAreaChart";
import { DonationListClient } from "../../donations/DonationListClient";
import { updateUserStatus, deleteUserAction } from "@/app/actions/users";
import { toast } from "sonner";

interface UserDetailClientProps {
  user: any;
  stats: any;
  donations: any[];
  documents: any[];
  tutelle: any[];
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center gap-4 group/item">
      <div className="p-3 rounded-2xl bg-muted group-hover/item:bg-yessal-violet/10 group-hover/item:text-yessal-violet transition-colors shrink-0">
        <Icon size={16} />
      </div>
      <div className="flex flex-col overflow-hidden min-w-0">
        <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
          {label}
        </span>
        <span className="font-bold text-sm truncate">{value || "—"}</span>
      </div>
    </div>
  );
}

export default function UserDetailClient({
  user,
  stats,
  donations,
  documents,
  tutelle,
}: UserDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const kpis = stats?.kpis || [];

  const handleBlock = () => {
    toast(`Bloquer l'accès de ${user?.first_name} ${user?.last_name} ?`, {
      action: {
        label: "Confirmer",
        onClick: () => startTransition(async () => {
          const res = await updateUserStatus(user.id, "block");
          if (res.error) { toast.error(res.error); return; }
          toast.success("Accès bloqué.");
          router.refresh();
        }),
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };

  const handleDelete = () => {
    toast(`Supprimer définitivement le compte de ${user?.first_name} ${user?.last_name} ?`, {
      description: "Cette action est irréversible.",
      action: {
        label: "Supprimer",
        onClick: () => startTransition(async () => {
          const res = await deleteUserAction(user.id);
          if (res.error) { toast.error(res.error); return; }
          toast.success("Compte supprimé.");
          router.push("/dashboard/members");
        }),
      },
      cancel: { label: "Annuler", onClick: () => {} },
    });
  };
  const campaignDonations = stats?.campaign_donations || [];
  const chartData = stats?.chartData || [];

  const IconMap: Record<string, any> = {
    Wallet,
    HandCoins,
    Landmark: Building2,
    Users,
  };

  return (
    <div className="flex flex-col gap-8">
      {/* TOP BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/members">Membres</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {user?.first_name} {user?.last_name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2 font-bold h-9 border-yessal-violet text-yessal-violet hover:bg-yessal-violet/5"
          >
            <Edit size={14} /> Modifier
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-muted"
              >
                <MoreVertical size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 rounded-xl p-2">
              <DropdownMenuItem disabled={isPending} className="rounded-lg gap-2 cursor-pointer text-orange-600 focus:text-orange-600 focus:bg-orange-50" onClick={handleBlock}>
                <ShieldAlert size={16} /> Bloquer l&apos;accès
              </DropdownMenuItem>
              <DropdownMenuItem disabled={isPending} className="rounded-lg gap-2 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50" onClick={handleDelete}>
                <ShieldAlert size={16} /> Supprimer le compte
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ─── PROFILE HERO ─────────────────────────────────────────── */}
      <div
        className="bg-white dark:bg-card rounded-3xl border shadow-sm overflow-visible relative"
        style={{ borderColor: "var(--border)" }}
      >
        {/* Banner */}
        <div className="h-44 rounded-t-3xl bg-gradient-to-r from-yessal-violet to-violet-600 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(45deg, white 0px, white 1px, transparent 0px, transparent 50%)`,
              backgroundSize: "20px 20px",
            }}
          />
          {/* ID badge */}
          <div className="absolute top-4 right-4">
            <Badge className="bg-white/20 backdrop-blur-md border-white/30 text-white font-bold py-1 px-3 flex items-center gap-1.5">
              <Hash size={12} /> {user?.id}
            </Badge>
          </div>
        </div>

        {/* Avatar – positioned so it is NOT clipped by overflow-hidden */}
        <div className="absolute top-[100px] left-8 p-1.5 bg-white dark:bg-card rounded-full shadow-2xl z-20 border-4 border-white dark:border-card">
          <Avatar className="size-28 md:size-32">
            <AvatarImage src={user?.avatar || user?.avatar_url || undefined} className="object-cover" />
            <AvatarFallback className="text-3xl font-black bg-muted uppercase">
              {user?.first_name?.[0]}
              {user?.last_name?.[0]}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Info row below banner */}
        <div className="pt-20 pb-8 px-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 md:ml-44">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-none">
                {user?.first_name} {user?.last_name}
              </h1>
              <Badge className="bg-yessal-violet/10 text-yessal-violet border-none font-black uppercase text-[10px] px-2 py-1 tracking-widest">
                {user?.role_display || user?.role}
              </Badge>
              {user?.is_active ? (
                <div className="flex items-center gap-1.5 bg-green-50 text-green-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">
                  <ShieldCheck size={12} /> Actif
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">
                  <ShieldAlert size={12} /> Inactif
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm font-bold">
              {user?.daara_name && (
                <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-lg">
                  <Building2 size={13} className="text-yessal-violet" />{" "}
                  {user.daara_name}
                </span>
              )}
              {user?.title_name && (
                <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-lg">
                  <BookOpen size={13} className="text-yessal-violet" />{" "}
                  {user.title_name}
                </span>
              )}
              {user?.ldd_name && (
                <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1 rounded-lg">
                  <MapPin size={13} className="text-yessal-violet" />{" "}
                  {user.ldd_name}
                </span>
              )}
              {user?.date_joined && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} /> Inscrit le{" "}
                  {new Date(user.date_joined).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── MAIN GRID ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── LEFT COLUMN ── */}
        <div className="space-y-6">
          {/* Contact & Identité */}
          <Card
            className="rounded-3xl border shadow-sm hover:shadow-md transition-shadow"
            style={{ borderColor: "var(--border)" }}
          >
            <CardHeader>
              <CardTitle className="text-base font-black flex items-center gap-2">
                <User size={16} className="text-yessal-violet" /> Contact &
                Identité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <InfoRow icon={Mail} label="Adresse Email" value={user?.email} />
              <InfoRow icon={Phone} label="Téléphone" value={user?.phone} />
              <InfoRow icon={MapPin} label="Localité (LDD)" value={user?.ldd_name} />
              <InfoRow icon={Building2} label="Daara" value={user?.daara_name} />
              <InfoRow icon={BookOpen} label="Titre honorifique" value={user?.title_name} />
              <InfoRow
                icon={CreditCard}
                label="Numéro de membre"
                value={user?.member_number || user?.id?.toString()}
              />
              <InfoRow
                icon={Calendar}
                label="Date d'inscription"
                value={
                  user?.date_joined
                    ? new Date(user.date_joined).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : undefined
                }
              />
              <InfoRow
                icon={Layers}
                label="Statut du compte"
                value={user?.is_active ? "Actif" : "Inactif"}
              />
            </CardContent>
          </Card>

          {/* Tutelle */}
          <Card
            className="rounded-3xl border shadow-sm overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Users size={16} className="text-yessal-violet" /> Tutelle
                <Badge variant="outline" className="ml-auto text-xs">
                  {tutelle.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {tutelle.length === 0 ? (
                <p className="p-8 text-center text-sm text-muted-foreground italic bg-muted/10">
                  Aucun tuteur renseigné.
                </p>
              ) : (
                <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {tutelle.map((t: any) => (
                    <li
                      key={t.id}
                      className="p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors group"
                    >
                      <Avatar className="size-9 shrink-0">
                        <AvatarImage src={t.avatar_url} />
                        <AvatarFallback className="text-xs font-black bg-yessal-violet/10 text-yessal-violet uppercase">
                          {t.first_name?.[0]}
                          {t.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm truncate">
                          {t.first_name} {t.last_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                          {t.relation || "Tuteur"}
                        </span>
                      </div>
                      {t.phone && (
                        <a
                          href={`tel:${t.phone}`}
                          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1 text-xs font-bold"
                          >
                            <Phone size={12} /> Appeler
                          </Button>
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Ndiguels Participés */}
          <Card
            className="rounded-3xl border shadow-sm overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <CardHeader className="bg-yessal-violet text-white">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Wallet size={16} /> Ndiguels Participés
                <Badge className="ml-auto bg-white/20 border-white/30 text-white text-xs">
                  {campaignDonations.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {campaignDonations.length === 0 ? (
                <p className="p-10 text-center text-sm text-muted-foreground italic bg-muted/10">
                  Aucune participation enregistrée.
                </p>
              ) : (
                <ul
                  className="divide-y"
                  style={{ borderColor: "var(--border)" }}
                >
                  {campaignDonations.map((cd: any) => (
                    <li
                      key={cd.id}
                      className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedCampaign(cd)}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm truncate max-w-[160px] group-hover:text-yessal-violet transition-colors">
                          {cd.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                          Contributeur
                        </span>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <span className="text-yessal-green font-black text-sm">{Number(cd.total).toLocaleString()} F
                        </span>
                        <button
                          className="text-[9px] font-black uppercase text-muted-foreground border border-dashed rounded px-1.5 py-0.5 hover:border-yessal-violet hover:text-yessal-violet transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCampaign(cd);
                          }}
                        >
                          Détail
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {campaignDonations.length > 5 && (
                <Button
                  variant="ghost"
                  className="w-full rounded-none h-11 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-yessal-violet"
                >
                  Voir tout ({campaignDonations.length})
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPI GRID */}
          {kpis.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi: any, idx: number) => {
                const Icon = IconMap[kpi.icon] || User;
                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-card p-5 rounded-3xl border shadow-sm flex flex-col gap-3 hover:border-yessal-violet/40 transition-all group"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div className="p-3 rounded-2xl bg-yessal-violet/10 text-yessal-violet w-fit group-hover:scale-110 transition-transform duration-300">
                      <Icon size={20} />
                    </div>
                    <div>
                      <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                        {kpi.title}
                      </p>
                      <h3 className="text-xl font-black mt-0.5 tracking-tighter text-yessal-violet leading-none">
                        {kpi.value}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TABS: Stats / Historique / Documents */}
          <Card
            className="rounded-3xl border shadow-sm bg-white dark:bg-card overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <CardContent className="p-0">
              <Tabs defaultValue="activity" className="w-full">
                <div
                  className="px-6 pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <h3 className="text-base font-black tracking-tight">
                    Activité & Documents
                  </h3>
                  <TabsList className="flex w-fit bg-transparent p-0 h-12 gap-8">
                    <TabsTrigger
                      value="activity"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-yessal-violet data-[state=active]:bg-transparent px-0 font-bold h-full"
                    >
                      Statistiques
                    </TabsTrigger>
                    <TabsTrigger
                      value="history"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-yessal-violet data-[state=active]:bg-transparent px-0 font-bold h-full"
                    >
                      Historique
                    </TabsTrigger>
                    <TabsTrigger
                      value="docs"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-yessal-violet data-[state=active]:bg-transparent px-0 font-bold h-full relative"
                    >
                      Documents
                      {documents.length > 0 && (
                        <span className="absolute -top-1 -right-3 size-4 bg-orange-500 text-white text-[8px] rounded-full flex items-center justify-center border border-white">
                          {documents.length}
                        </span>
                      )}
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent
                    value="activity"
                    className="space-y-4 mt-0 data-[state=active]:animate-in data-[state=active]:fade-in duration-300"
                  >
                    <div
                      className="h-[340px] w-full bg-muted/5 rounded-2xl p-4 border border-dashed"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <AppAreaChart
                        data={chartData}
                        title="Évolution financière"
                        subtitle="Cumul des dons sur l'année en cours"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="history"
                    className="mt-0 data-[state=active]:animate-in data-[state=active]:fade-in duration-300"
                  >
                    <div className="-mx-6">
                      <DonationListClient
                        initialDonations={donations}
                        variant="directory"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="docs"
                    className="mt-0 data-[state=active]:animate-in data-[state=active]:fade-in duration-300"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {documents.length === 0 ? (
                        <div className="col-span-full p-12 text-center bg-muted/20 rounded-2xl border border-dashed flex flex-col items-center gap-3">
                          <FileText
                            size={40}
                            className="text-muted-foreground/20"
                          />
                          <p className="text-muted-foreground italic text-sm">
                            Aucun document d&apos;identité téléchargé.
                          </p>
                        </div>
                      ) : (
                        documents.map((doc: any) => (
                          <div
                            key={doc.id}
                            className="p-4 rounded-2xl border bg-muted/5 flex items-center justify-between group hover:border-yessal-violet/30 transition-colors"
                            style={{ borderColor: "var(--border)" }}
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-3 rounded-xl bg-white shadow-sm text-yessal-violet border">
                                <FileText size={22} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm uppercase">
                                  {doc.type_display || "Pièce d'identité"}
                                </span>
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                  {doc.status === "validated" ? (
                                    <>
                                      <CheckCircle2
                                        size={10}
                                        className="text-green-500"
                                      />
                                      Validé le{" "}
                                      {new Date(
                                        doc.validated_at,
                                      ).toLocaleDateString("fr-FR")}
                                    </>
                                  ) : (
                                    <>
                                      <Clock
                                        size={10}
                                        className="text-orange-500"
                                      />
                                      En attente de validation
                                    </>
                                  )}
                                </span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity font-bold"
                              onClick={() => setSelectedDoc(doc)}
                            >
                              Voir
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ─── NDIGUEL DETAIL MODAL ──────────────────────────────────── */}
      <Dialog
        open={!!selectedCampaign}
        onOpenChange={(open) => !open && setSelectedCampaign(null)}
      >
        <DialogContent className="max-w-sm rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedCampaign && (
            <div className="flex flex-col">
              <div className="bg-gradient-to-br from-yessal-violet to-violet-700 p-6 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white text-xl font-black leading-tight">
                    {selectedCampaign.name}
                  </DialogTitle>
                  <DialogDescription className="text-white/70 text-[11px] font-black uppercase tracking-widest mt-1">
                    Ndiguel · Détail de la participation
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-6 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
                    Montant total contribué
                  </p>
                  <p className="text-4xl font-black mt-1">
                    {Number(selectedCampaign.total).toLocaleString()}
                    <span className="text-lg ml-1 opacity-70">F CFA</span>
                  </p>
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-card space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {selectedCampaign.count != null && (
                    <div className="flex flex-col items-center p-4 rounded-2xl bg-muted/30">
                      <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                        Nbre de dons
                      </span>
                      <span className="text-2xl font-black mt-1 text-yessal-violet">
                        {selectedCampaign.count}
                      </span>
                    </div>
                  )}
                  {selectedCampaign.last_donation && (
                    <div className="flex flex-col items-center p-4 rounded-2xl bg-muted/30">
                      <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                        Dernier don
                      </span>
                      <span className="text-sm font-black mt-1">
                        {new Date(
                          selectedCampaign.last_donation,
                        ).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  )}
                </div>

                {selectedCampaign.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedCampaign.description}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-yessal-violet hover:bg-yessal-violet/90 font-black h-11 rounded-xl gap-2"
                    asChild
                  >
                    <a href={`/dashboard/campaigns/${selectedCampaign.id}`}>
                      <ExternalLink size={14} /> Voir le Ndiguel
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 font-bold h-11 rounded-xl"
                    onClick={() => setSelectedCampaign(null)}
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── DOCUMENT VIEWER ─────────────────────────────────────── */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black uppercase text-sm tracking-widest">
              {selectedDoc?.type_display || "Document d'identité"}
            </DialogTitle>
            <DialogDescription className="text-[10px]">
              {selectedDoc?.status === "validated" ? "Validé" : "En attente de validation"}
              {selectedDoc?.doc_number ? ` · N° ${selectedDoc.doc_number}` : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedDoc && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
              {selectedDoc.image && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Recto</p>
                  <a href={selectedDoc.image} target="_blank" rel="noopener noreferrer">
                    <img src={selectedDoc.image} alt="Recto" className="rounded-xl border w-full object-cover max-h-60 hover:opacity-90 transition-opacity" />
                  </a>
                </div>
              )}
              {selectedDoc.image_verso && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Verso</p>
                  <a href={selectedDoc.image_verso} target="_blank" rel="noopener noreferrer">
                    <img src={selectedDoc.image_verso} alt="Verso" className="rounded-xl border w-full object-cover max-h-60 hover:opacity-90 transition-opacity" />
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
