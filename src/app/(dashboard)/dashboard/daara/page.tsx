import { getMyDaara } from "@/app/actions/daara";
import { getProfile, getDirectoryUsers, getPilotageSettings } from "@/app/actions/users";
import {
  Activity,
  Calendar,
  Building2,
  MapPin,
  Hash,
  UserCircle,
  MessageSquare,
  Users2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CollectorList } from "./CollectorList";

type DaaraPayload = {
  name: string;
  code?: string;
  description?: string | null;
  is_active?: boolean;
  created_at?: string;
  location?: string;
  members_count?: number;
  chef_full_name?: string | null;
  collectors?: Array<{
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  }>;
  ldd?: {
    id: number;
    code: string;
    name: string;
  };
};

export default async function DaaraPage() {
  const [
    { data: daara, error },
    { data: profile },
    { data: directory },
    { data: pilotage }
  ] = await Promise.all([
    getMyDaara(),
    getProfile(),
    getDirectoryUsers(),
    getPilotageSettings(),
  ]);

  const showMembersLink =
    profile?.role === "chef_daara" || profile?.role === "collector";

  if (error) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <Building2 size={28} className="text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-foreground">
            Impossible de charger le Daara
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">{error}</p>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!daara) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-muted/40 flex items-center justify-center">
            <Building2 size={36} className="text-muted-foreground/30" />
          </div>
          <h2 className="text-xl font-bold">
            Vous n&apos;êtes pas encore affilié à un Daara
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Contactez votre Chef Daara ou l&apos;administrateur pour être
            rattaché à une communauté.
          </p>
          <Button
            asChild
            style={{ background: "var(--yessal-green)", color: "white" }}
          >
            <Link href="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </div>
      </div>
    );
  }

  const d = daara as DaaraPayload;
  const membersCount = d.members_count ?? null;
  const collectors = d.collectors ?? [];

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col gap-8">
      <div
        className="relative overflow-hidden rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        style={{
          background:
            "linear-gradient(135deg, var(--yessal-green) 0%, #2D7A4F 100%)",
        }}
      >
        <div className="relative z-10 text-white">
          <div className="flex items-center gap-2 text-white/70 text-xs uppercase font-black tracking-widest mb-3">
            <Building2 size={14} /> Mon Daara
          </div>
          <h1 className="text-4xl font-bold tracking-tight">{d.name}</h1>
          <div className="flex items-center gap-4 mt-3 text-white/80 text-sm flex-wrap">
            {d.code && (
              <span className="flex items-center gap-1.5">
                <Hash size={13} /> Code : <strong>{d.code}</strong>
              </span>
            )}
            {d.ldd && (
              <span className="flex items-center gap-1.5">
                <Building2 size={13} /> LDD : <strong>{d.ldd.name} ({d.ldd.code})</strong>
              </span>
            )}
            {d.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={13} /> {d.location}
              </span>
            )}
          </div>
        </div>
        <div
          className="flex-shrink-0 h-20 w-20 rounded-2xl flex items-center justify-center shadow-xl"
          style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
          }}
        >
          <Building2 size={36} className="text-white" />
        </div>
        <div
          className="absolute -right-12 -top-12 w-48 h-48 rounded-full opacity-10"
          style={{ background: "white" }}
        />
        <div
          className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full opacity-10"
          style={{ background: "white" }}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div
          className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col gap-3"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Statut
            </span>
            <div
              className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                d.is_active
                  ? "bg-green-100 text-green-700 dark:bg-green-900/40"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${d.is_active ? "bg-green-500" : "bg-red-500"}`}
              />
              {d.is_active ? "Actif" : "Inactif"}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Activity size={32} className="text-muted-foreground/20 shrink-0" />
            <p className="text-sm text-muted-foreground">
              {d.description ||
                "Aucune description renseignée pour ce Daara."}
            </p>
          </div>
        </div>

        <div
          className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col gap-2"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
            <UserCircle size={12} /> Chef de Daara
          </span>
          <p className="text-lg font-bold mt-1" style={{ color: "var(--foreground)" }}>
            {d.chef_full_name || "Non renseigné"}
          </p>
          {membersCount != null && (
            <p className="text-xs text-muted-foreground mt-2">
              Effectif : <strong>{membersCount}</strong> membre
              {membersCount !== 1 ? "s" : ""} sur la plateforme
            </p>
          )}
        </div>

        <div
          className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col gap-2"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Collecteurs
          </span>
          {collectors.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-2">
              Aucun collecteur désigné pour ce Daara.
            </p>
          ) : (
            <CollectorList collectors={collectors} />
          )}
        </div>
      </div>

      {showMembersLink && (
        <div className="flex justify-end">
          <Button variant="outline" asChild>
            <Link href="/dashboard/members">Gérer les membres du Daara</Link>
          </Button>
        </div>
      )}

      {/* AUTRES MEMBRES DU DAARA */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
            <Users2 size={20} className="text-yessal-green" /> Les autres membres de mon Daara
        </h3>
        
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-muted/30 border-b" style={{ borderColor: "var(--border)" }}>
                        <th className="px-6 py-4 text-left font-black uppercase tracking-widest text-[10px] text-muted-foreground">Membre</th>
                        <th className="px-6 py-4 text-left font-black uppercase tracking-widest text-[10px] text-muted-foreground">Rôle</th>
                        <th className="px-6 py-4 text-right font-black uppercase tracking-widest text-[10px] text-muted-foreground">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {directory?.length > 0 ? (
                        directory.filter((u: any) => u.id !== profile.id).map((member: any) => (
                            <tr key={member.id} className="hover:bg-muted/10 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-bold">{member.first_name} {member.last_name}</span>
                                        <span className="text-xs text-muted-foreground">{member.email}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-muted px-2 py-1 rounded text-muted-foreground">
                                        {member.role === 'member' ? 'Talibé' : member.role?.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {pilotage?.enable_salons ? (
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            asChild
                                            className="text-yessal-green hover:bg-yessal-green/10 font-bold gap-2"
                                        >
                                            <Link href={`/dashboard/chat/nouveau?with=${member.id}`}>
                                                <MessageSquare size={14} /> 
                                                <span className="hidden sm:inline">Inviter dans un salon</span>
                                            </Link>
                                        </Button>
                                    ) : (
                                        <span className="text-[10px] text-muted-foreground italic">Salons désactivés</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground italic">
                                Aucun autre membre trouvé dans ce Daara.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}
