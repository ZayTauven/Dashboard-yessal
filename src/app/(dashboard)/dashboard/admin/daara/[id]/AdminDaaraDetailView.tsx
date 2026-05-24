"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateDaara } from "@/app/actions/daara";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Building2,
  Layers,
  Users,
  TrendingUp,
  BookOpen,
  UserCircle,
  Phone,
  Mail,
  Edit,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

type Member = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  role: string;
  avatar?: string | null;
  title_name?: string | null;
};

type Campaign = {
  id: number;
  name: string;
  goal_amount: string | null;
  collected_amount: string;
  progress_pct: number;
  status: string;
  deadline: string;
  organizer_name: string | null;
};

type Etat = {
  id: number;
  name: string;
  is_active: boolean;
  created_at?: string | null;
  ldd?: { id: number; code: string; name: string } | null;
  chef?: Member | null;
  members_count: number;
  collectors_count: number;
  total_collected: string;
  donation_count: number;
  campaigns_count: number;
  members: Member[];
  collectors: Member[];
  campaigns: Campaign[];
};

type DaaraData = {
  id: number;
  name: string;
  is_active?: boolean;
  ldd?: { id: number; code: string; name: string; location?: string | null } | null;
};

const ROLE_LABELS: Record<string, string> = {
  member: "Talibé",
  chef_daara: "Chef Daara",
  collector: "Collecteur",
  admin: "Admin",
};

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  active: { label: "Actif", icon: CheckCircle2, cls: "bg-green-100 text-green-700" },
  pending: { label: "En attente", icon: Clock, cls: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Terminé", icon: CheckCircle2, cls: "bg-gray-100 text-gray-600" },
  inactive: { label: "Inactif", icon: XCircle, cls: "bg-red-100 text-red-600" },
};

function MemberAvatar({ m, size = "h-9 w-9" }: { m: Member; size?: string }) {
  return (
    <Avatar className={size}>
      <AvatarImage src={m.avatar || undefined} className="object-cover" />
      <AvatarFallback className="bg-yessal-violet/10 text-yessal-violet font-bold text-xs uppercase">
        {m.first_name?.[0]}{m.last_name?.[0]}
      </AvatarFallback>
    </Avatar>
  );
}

export function AdminDaaraDetailView({
  daara,
  etat,
}: {
  daara: DaaraData;
  etat: Etat | null;
}) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrorMsg("");
    startTransition(async () => {
      const res = await updateDaara(daara.id, {
        name: String(formData.get("name") || "").trim(),
        is_active: formData.get("is_active") === "on",
      });
      if (res.error) { setErrorMsg(res.error); return; }
      toast.success("Daara mis à jour.");
      setIsEditOpen(false);
      router.refresh();
    });
  };

  const totalCollected = Number(etat?.total_collected || 0);

  return (
    <div className="p-6 max-w-6xl mx-auto flex flex-col gap-6">
      {/* Back */}
      <Button variant="ghost" className="w-fit gap-2 -ml-2" asChild>
        <Link href="/dashboard/admin/daara">
          <ArrowLeft size={16} /> Retour à la liste
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">{etat?.name ?? daara.name}</h1>
            <Badge className={`text-[10px] uppercase font-bold border-none ${daara.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {daara.is_active ? "Actif" : "Inactif"}
            </Badge>
            {(etat?.ldd ?? daara.ldd) && (
              <Badge variant="outline" className="text-[10px] font-bold gap-1">
                <Layers size={10} /> {(etat?.ldd ?? daara.ldd)?.code} — {(etat?.ldd ?? daara.ldd)?.name}
              </Badge>
            )}
            {etat?.created_at && (
              <span className="text-xs text-muted-foreground">
                Créé le {new Date(etat.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
          </div>
        </div>
        <Button
          onClick={() => setIsEditOpen(true)}
          className="gap-2 bg-yessal-violet hover:bg-violet-700 text-white border-none shadow-lg shadow-yessal-violet/20 font-bold uppercase tracking-widest text-[10px] h-11 px-6 rounded-xl"
        >
          <Edit size={14} /> Modifier le Daara
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Membres", value: etat?.members_count ?? "—", color: "text-yessal-violet" },
          { icon: UserCircle, label: "Collecteurs", value: etat?.collectors_count ?? "—", color: "text-blue-600" },
          { icon: TrendingUp, label: "Total collecté", value: `${totalCollected.toLocaleString("fr-FR")} F`, color: "text-yessal-green" },
          { icon: BookOpen, label: "Ndiguels", value: etat?.campaigns_count ?? "—", color: "text-orange-500" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card rounded-xl border p-4 flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Icon size={14} className={color} /> {label}
            </div>
            <span className={`text-2xl font-bold ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl w-fit">
          <TabsTrigger value="members" className="rounded-lg px-5 font-bold">
            Membres <Badge variant="secondary" className="ml-2 text-[10px]">{etat?.members_count ?? 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="collectors" className="rounded-lg px-5 font-bold">
            Collecteurs <Badge variant="secondary" className="ml-2 text-[10px]">{etat?.collectors_count ?? 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="finances" className="rounded-lg px-5 font-bold">
            Finances <Badge variant="secondary" className="ml-2 text-[10px]">{etat?.campaigns_count ?? 0}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── MEMBRES ── */}
        <TabsContent value="members" className="mt-4">
          {/* Chef highlight */}
          {etat?.chef && (
            <div className="mb-4 flex items-center gap-4 p-4 rounded-xl border bg-yessal-violet/5 border-yessal-violet/20">
              <MemberAvatar m={etat.chef} size="h-12 w-12" />
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-yessal-violet mb-0.5">Chef de Daara</div>
                <div className="font-bold">{etat.chef.first_name} {etat.chef.last_name}</div>
                <div className="text-xs text-muted-foreground">{etat.chef.email}</div>
              </div>
              {etat.chef.phone && (
                <a href={`tel:${etat.chef.phone}`} className="ml-auto">
                  <Button size="sm" variant="outline" className="gap-1 font-bold text-xs h-8">
                    <Phone size={12} /> {etat.chef.phone}
                  </Button>
                </a>
              )}
            </div>
          )}

          <div className="bg-card rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "var(--border)" }}>
            {!etat?.members?.length ? (
              <div className="p-12 text-center text-sm text-muted-foreground italic">Aucun membre enregistré dans ce Daara.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-5 py-3 text-left font-bold uppercase text-[10px] tracking-widest">Membre</th>
                    <th className="px-5 py-3 text-left font-bold uppercase text-[10px] tracking-widest">Rôle</th>
                    <th className="px-5 py-3 text-left font-bold uppercase text-[10px] tracking-widest">Téléphone</th>
                    <th className="px-5 py-3 text-right font-bold uppercase text-[10px] tracking-widest">Fiche</th>
                  </tr>
                </thead>
                <tbody>
                  {etat.members.map((m) => (
                    <tr key={m.id} className="border-t hover:bg-muted/10 transition-colors" style={{ borderColor: "var(--border)" }}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <MemberAvatar m={m} />
                          <div className="flex flex-col">
                            <span className="font-semibold">{m.first_name} {m.last_name}</span>
                            <span className="text-[10px] text-muted-foreground">{m.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider">
                          {ROLE_LABELS[m.role] ?? m.role}
                        </Badge>
                        {m.title_name && (
                          <span className="ml-2 text-[10px] text-muted-foreground italic">{m.title_name}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{m.phone || "—"}</td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-[10px] font-bold" asChild>
                          <Link href={`/dashboard/users/${m.id}`}>
                            <ExternalLink size={11} /> Voir
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        {/* ── COLLECTEURS ── */}
        <TabsContent value="collectors" className="mt-4">
          {!etat?.collectors?.length ? (
            <div className="p-12 text-center text-sm text-muted-foreground italic border-2 border-dashed rounded-xl">
              Aucun collecteur désigné pour ce Daara.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {etat.collectors.map((c) => (
                <div key={c.id} className="bg-card rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "var(--border)" }}>
                  <div className="bg-yessal-violet p-5 flex items-center gap-4">
                    <Avatar className="h-14 w-14 border-2 border-white/30">
                      <AvatarImage src={c.avatar || undefined} className="object-cover" />
                      <AvatarFallback className="bg-white/20 text-white font-bold text-lg">
                        {c.first_name?.[0]}{c.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-white">
                      <div className="font-bold text-base leading-tight">{c.first_name} {c.last_name}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mt-0.5">Collecteur Officiel</div>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail size={13} className="text-muted-foreground shrink-0" />
                      <span className="truncate text-xs">{c.email}</span>
                    </div>
                    {c.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone size={13} className="text-muted-foreground shrink-0" />
                        <span className="text-xs">{c.phone}</span>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      {c.phone && (
                        <Button size="sm" className="flex-1 bg-yessal-violet text-white border-none h-9 text-[10px] font-bold gap-1" asChild>
                          <a href={`tel:${c.phone}`}><Phone size={12} /> Appeler</a>
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="flex-1 h-9 text-[10px] font-bold gap-1" asChild>
                        <Link href={`/dashboard/users/${c.id}`}><ExternalLink size={12} /> Fiche</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── FINANCES ── */}
        <TabsContent value="finances" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card rounded-xl border p-5 flex flex-col gap-1" style={{ borderColor: "var(--border)" }}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total collecté</span>
              <span className="text-3xl font-bold text-yessal-green">{totalCollected.toLocaleString("fr-FR")} <span className="text-sm font-normal">FCFA</span></span>
              <span className="text-xs text-muted-foreground">{etat?.donation_count ?? 0} don{(etat?.donation_count ?? 0) > 1 ? "s" : ""} confirmés</span>
            </div>
            <div className="bg-card rounded-xl border p-5 flex flex-col gap-1" style={{ borderColor: "var(--border)" }}>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ndiguels associés</span>
              <span className="text-3xl font-bold">{etat?.campaigns_count ?? 0}</span>
              <span className="text-xs text-muted-foreground">campagnes liées à ce Daara</span>
            </div>
          </div>

          {etat?.campaigns?.length ? (
            <div className="bg-card rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <div className="px-5 py-4 border-b font-bold text-sm" style={{ borderColor: "var(--border)" }}>Ndiguels du Daara</div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {etat.campaigns.map((c) => {
                  const cfg = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  const goal = Number(c.goal_amount || 0);
                  const collected = Number(c.collected_amount || 0);
                  return (
                    <div key={c.id} className="px-5 py-4 flex items-center gap-4 hover:bg-muted/10 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Link href={`/dashboard/campaigns/${c.id}/etat`} className="font-semibold text-sm hover:underline" style={{ color: "var(--primary)" }}>
                            {c.name}
                          </Link>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.cls}`}>
                            <StatusIcon size={10} /> {cfg.label}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex gap-3 flex-wrap">
                          {c.organizer_name && <span>Organisateur : {c.organizer_name}</span>}
                          <span>Échéance : {new Date(c.deadline).toLocaleDateString("fr-FR")}</span>
                        </div>
                        {goal > 0 && (
                          <div className="mt-2 flex items-center gap-3">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-yessal-green rounded-full" style={{ width: `${Math.min(c.progress_pct, 100)}%` }} />
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">{c.progress_pct}%</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-yessal-green">{collected.toLocaleString("fr-FR")} <span className="text-xs font-normal text-muted-foreground">FCFA</span></div>
                        {goal > 0 && <div className="text-[10px] text-muted-foreground">sur {goal.toLocaleString("fr-FR")} FCFA</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground italic border-2 border-dashed rounded-xl">
              Aucun Ndiguel associé à ce Daara.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── EDIT DIALOG ── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 size={18} className="text-yessal-violet" /> Modifier le Daara
            </DialogTitle>
          </DialogHeader>
          {daara.ldd && (
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-muted/20 text-sm" style={{ borderColor: "var(--border)" }}>
              <Layers size={14} className="text-yessal-violet shrink-0" />
              <span className="font-bold">[{daara.ldd.code}] {daara.ldd.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">non modifiable ici</span>
            </div>
          )}
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Nom du Daara <span className="text-red-500">*</span>
              </label>
              <Input name="name" defaultValue={daara.name} required className="h-11" />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer p-3 rounded-lg border bg-muted/20" style={{ borderColor: "var(--border)" }}>
              <input type="checkbox" name="is_active" defaultChecked={daara.is_active !== false} className="rounded border" />
              <span className="font-medium">Daara actif</span>
            </label>
            {errorMsg && <p className="text-sm text-red-600 font-medium p-3 bg-red-50 rounded-lg">{errorMsg}</p>}
            <Button type="submit" disabled={isPending} className="w-full h-11 bg-yessal-violet text-white border-none font-bold">
              {isPending ? "Enregistrement…" : "Enregistrer les modifications"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
