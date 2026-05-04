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
import { Search, Users, Building2, Filter, UserCircle } from "lucide-react";
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
  avatar?: string | null;
  title?: string | null;
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
        {filtered.map((m) => {
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle size={20} style={{ color: "var(--yessal-green)" }} />
              Fiche Talibé
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Nom : </span>
                <strong>
                  {detail.first_name} {detail.last_name}
                </strong>
              </p>
              <p>
                <span className="text-muted-foreground">Titre : </span>
                {detail.title || "Talibé"}
              </p>
              <p>
                <span className="text-muted-foreground">E-mail : </span>
                {detail.email}
              </p>
              {detail.phone ? (
                <p>
                  <span className="text-muted-foreground">Téléphone : </span>
                  {detail.phone}
                </p>
              ) : null}
              <p>
                <span className="text-muted-foreground">Rôle : </span>
                {ROLE_LABELS[detail.role as Role] || detail.role}
              </p>
              <p>
                <span className="text-muted-foreground">Statut : </span>
                {detail.status}
              </p>
              {detail.daara_name ? (
                <p>
                  <span className="text-muted-foreground">Daara : </span>
                  {detail.daara_name}
                </p>
              ) : null}
              {promoteError && (
                <p className="text-xs text-red-600 font-medium">
                  {promoteError}
                </p>
              )}
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
    </div>
  );
}
