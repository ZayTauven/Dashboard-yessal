"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SmartLink } from "@/components/SmartLink";
import { Search, Users, Building2, Filter, UserCircle, Phone, Mail, Shield, MapPin, FileText, CheckCircle2, XCircle } from "lucide-react";
import { promoteUserToCollector } from "@/app/actions/directory";

type Role = "chef_daara" | "collector" | "member";

const ROLE_LABELS: Record<Role, string> = {
  chef_daara: "Chef Daara",
  collector: "Talibé · Collecteur",
  member: "Talibé",
};

const ROLE_COLORS: Record<Role, string> = {
  chef_daara: "bg-blue-100 text-blue-700 dark:bg-blue-900/40",
  collector: "bg-orange-100 text-orange-700 dark:bg-orange-900/40",
  member: "bg-green-100 text-green-700 dark:bg-green-900/40",
};

const FILTER_ROLES: (Role | "all")[] = [
  "all",
  "member",
  "chef_daara",
  "collector",
];

type MemberRow = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  role: string;
  status: string;
  daara_name?: string | null;
  zone_name?: string | null;
  zone_code?: string | null;
  avatar?: string | null;
  title?: string | null;
  documents_count?: number;
};

export function MembersClient({
  initialMembers,
  viewerRole,
}: {
  initialMembers: MemberRow[];
  viewerRole: "admin" | "chef_daara" | "collector";
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [detail, setDetail] = useState<MemberRow | null>(null);
  const [isPending, startTransition] = useTransition();
  const [promoteError, setPromoteError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return initialMembers.filter((m) => {
      const r = m.role as Role;
      const matchesSearch =
        !q ||
        m.first_name?.toLowerCase().includes(q) ||
        m.last_name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.daara_name?.toLowerCase().includes(q);
      const matchesRole = roleFilter === "all" || m.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [initialMembers, search, roleFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialMembers.length };
    initialMembers.forEach((m) => {
      counts[m.role] = (counts[m.role] || 0) + 1;
    });
    return counts;
  }, [initialMembers]);

  const handlePromote = (id: number) => {
    setPromoteError("");
    startTransition(async () => {
      const res = await promoteUserToCollector(id);
      if (res.error) {
        setPromoteError(res.error);
        return;
      }
      setDetail(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Rechercher par nom, email ou Daara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-card border rounded-xl"
            style={{ borderColor: "var(--border)" }}
          />
        </div>
        <div className="flex items-center gap-2 bg-muted/40 rounded-xl p-1 flex-wrap">
          <Filter size={13} className="text-muted-foreground ml-2" />
          {FILTER_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                roleFilter === r
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r === "all" ? "Tous" : ROLE_LABELS[r as Role]}{" "}
              <span className="opacity-60">({roleCounts[r] ?? 0})</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground font-medium">
        {filtered.length} résultat{filtered.length !== 1 ? "s" : ""}
      </p>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center">
            <Users size={28} className="text-muted-foreground/30" />
          </div>
          <p className="text-sm text-muted-foreground">
            Aucun résultat ne correspond à votre recherche.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginated.map((m) => {
          const role = m.role as Role;
          const roleColor = ROLE_COLORS[role] || ROLE_COLORS.member;
          const roleLabel = ROLE_LABELS[role] || m.role;
          const initials = `${m.first_name?.[0] ?? ""}${m.last_name?.[0] ?? ""}`;

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setDetail(m)}
              className="text-left bg-card border rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-yessal-green/20 transition-all group"
              style={{ borderColor: "var(--border)" }}
            >
              <Avatar className="h-14 w-14 flex-shrink-0 ring-2 ring-transparent group-hover:ring-yessal-green/20 transition-all">
                <AvatarImage
                  src={m.avatar || undefined}
                  className="object-cover"
                />
                <AvatarFallback
                  className="text-white font-black text-sm"
                  style={{ background: "var(--yessal-green)" }}
                >
                  {initials || "?"}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="font-bold truncate text-base group-hover:text-yessal-green transition-colors">
                  {m.first_name} {m.last_name}
                </div>
                <div className="text-xs text-muted-foreground truncate mb-2">
                  {m.email}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant="secondary"
                    className={`capitalize text-[10px] py-0 px-2 font-black border-none ${roleColor}`}
                  >
                    {roleLabel}
                  </Badge>
                  {m.daara_name && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                      <Building2 size={10} /> {m.daara_name}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl">
          {detail && (
            <div className="flex flex-col">
              {/* Header Visual */}
              <div className="bg-yessal-green p-8 flex flex-col items-center gap-4 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <Users size={200} className="absolute -bottom-10 -right-10 rotate-12" />
                </div>
                <Avatar className="h-24 w-24 border-4 border-white/30 shadow-xl relative z-10">
                  <AvatarImage src={detail.avatar || undefined} className="object-cover" />
                  <AvatarFallback className="bg-white text-yessal-green text-3xl font-black">
                    {detail.first_name?.[0]}{detail.last_name?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center text-white relative z-10">
                  <h3 className="text-2xl font-black">{detail.first_name} {detail.last_name}</h3>
                  <Badge className="mt-2 bg-white/20 text-white border-none backdrop-blur-md uppercase text-[10px] font-black px-3 py-1">
                    {ROLE_LABELS[detail.role as Role] || detail.role}
                  </Badge>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Status & Identity */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 p-3 rounded-2xl border flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Statut</span>
                        <div className="flex items-center gap-2">
                            {detail.status === 'active' ? (
                                <><CheckCircle2 size={16} className="text-green-600" /> <span className="font-bold text-sm text-green-700">Actif</span></>
                            ) : (
                                <><XCircle size={16} className="text-red-600" /> <span className="font-bold text-sm text-red-700">Inactif</span></>
                            )}
                        </div>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-2xl border flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase text-muted-foreground">Titre</span>
                        <div className="flex items-center gap-2 font-bold text-sm">
                            <Shield size={16} className="text-yessal-green" /> {detail.title || "Talibé"}
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b pb-1">Coordonnées</h4>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="w-8 h-8 rounded-lg bg-yessal-green/10 flex items-center justify-center text-yessal-green">
                            <Mail size={16} />
                        </div>
                        <span className="font-medium">{detail.email}</span>
                    </div>
                    {detail.phone && (
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-yessal-green/10 flex items-center justify-center text-yessal-green">
                                <Phone size={16} />
                            </div>
                            <span className="font-medium">{detail.phone}</span>
                        </div>
                    )}
                </div>

                {/* Localisation */}
                <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border-b pb-1">Localisation</h4>
                    <div className="grid grid-cols-1 gap-2">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-yessal-green/10 flex items-center justify-center text-yessal-green">
                                <Building2 size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-xs">{detail.daara_name || "Non assigné"}</span>
                                <span className="text-[10px] text-muted-foreground">Daara</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-yessal-green/10 flex items-center justify-center text-yessal-green">
                                <MapPin size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-xs">{detail.zone_name || "Inconnue"} ({detail.zone_code || "??"})</span>
                                <span className="text-[10px] text-muted-foreground">Zone Territoriale</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Documents */}
                <div className="bg-muted/30 p-4 rounded-2xl border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText size={20} className="text-muted-foreground" />
                        <div>
                            <div className="text-xs font-bold">{detail.documents_count || 0} document(s)</div>
                            <div className="text-[10px] text-muted-foreground">Soumis pour validation</div>
                        </div>
                    </div>
                    <Button variant="link" className="text-yessal-green text-xs font-bold p-0">Consulter</Button>
                </div>

                {promoteError && (
                  <p className="text-xs text-red-600 font-medium text-center">
                    {promoteError}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            {detail && (
              <Button
                type="button"
                variant="outline"
                className="border-yessal-green text-yessal-green hover:bg-yessal-green/5 font-bold"
                onClick={() => router.push(`/dashboard/users/${detail.id}`)}
              >
                Voir plus de détails
              </Button>
            )}
            {detail &&
              detail.role === "member" &&
              (viewerRole === "chef_daara" || viewerRole === "admin") && (
                <Button
                  type="button"
                  disabled={isPending}
                  style={{ background: "var(--yessal-green)", color: "white" }}
                  onClick={() => handlePromote(detail.id)}
                >
                  {isPending ? "…" : "Nommer collecteur"}
                </Button>
              )}
            <Button
              type="button"
              variant="outline"
              onClick={() => setDetail(null)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-9 px-4 rounded-lg font-bold border-none bg-muted/20"
          >
            Précédent
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={currentPage === p ? "default" : "ghost"}
                size="sm"
                onClick={() => setCurrentPage(p)}
                className={`h-9 w-9 rounded-lg font-bold border-none ${
                  currentPage === p 
                    ? "bg-yessal-green text-white shadow-lg shadow-yessal-green/20" 
                    : "text-muted-foreground hover:text-yessal-green hover:bg-yessal-green/5"
                }`}
              >
                {p}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-9 px-4 rounded-lg font-bold border-none bg-muted/20"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
