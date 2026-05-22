"use client";

import { CreditCard, History, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SmartLink } from "@/components/SmartLink";
import { useState, useMemo } from "react";
import { ExportButton } from "@/components/ExportButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DonationRow = {
  id: number;
  created_at: string;
  campaign_id?: number;
  campaign_name?: string;
  beneficiary_name?: string | null;
  amount: string | number;
  payment_method: string;
  payment_status: string;
  donor_id?: number;
  donor_name?: string | null;
  donor_daara_name?: string | null;
};

export function DonationListClient({
  initialDonations,
  variant = "personal",
}: {
  initialDonations: DonationRow[];
  variant?: "personal" | "directory";
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredDonations = useMemo(() => {
    const q = search.toLowerCase();
    return initialDonations.filter((don) => {
      const matchesSearch =
        !q ||
        don.campaign_name?.toLowerCase().includes(q) ||
        don.beneficiary_name?.toLowerCase().includes(q) ||
        don.id.toString().includes(q) ||
        (variant === "directory" &&
          (don.donor_name?.toLowerCase().includes(q) ||
            don.donor_daara_name?.toLowerCase().includes(q)));
      const matchesStatus =
        statusFilter === "all" || don.payment_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [initialDonations, search, statusFilter, variant]);

  const totalPages = Math.ceil(filteredDonations.length / itemsPerPage);
  const paginatedDonations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredDonations.slice(start, start + itemsPerPage);
  }, [filteredDonations, currentPage]);

  const exportData = useMemo(() => {
    return filteredDonations.map((don) => {
      const base: Record<string, string | number> = {
        Date: new Date(don.created_at).toLocaleDateString(),
        Référence: `REF-${don.id}`,
        Campagne: String(don.campaign_name ?? ""),
        Bénéficiaire: don.beneficiary_name || "Moi-même",
        Montant: Number(don.amount),
        Méthode: don.payment_method.toUpperCase(),
        Statut: don.payment_status.toUpperCase(),
      };
      if (variant === "directory") {
        base.Contributeur = String(don.donor_name ?? "—");
        base.Daara = String(don.donor_daara_name ?? "—");
      }
      return base;
    });
  }, [filteredDonations, variant]);

  const showDirectoryCols = variant === "directory";

  return (
    <div className="space-y-6">
      <div
        className="flex flex-col md:flex-row items-center gap-4 bg-muted/20 p-4 rounded-xl border"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="relative flex-1 group w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-yessal-violet transition-colors"
            size={16}
          />
          <Input
            placeholder={
              showDirectoryCols
                ? "Campagne, contributeur, Daara, référence…"
                : "Campagne, bénéficiaire ou référence…"
            }
            className="pl-10 bg-card border-none focus-visible:ring-1 focus-visible:ring-yessal-violet h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] h-11 border-none bg-card">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="confirmed">Confirmé</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="pending_wire">Virement en attente</SelectItem>
              <SelectItem value="failed">Échoué</SelectItem>
            </SelectContent>
          </Select>
          <ExportButton data={exportData} filename="Yessal_Dons_Export" />
        </div>
      </div>

      <div
        className="border rounded-xl overflow-hidden shadow-sm"
        style={{ borderColor: "var(--border)" }}
      >
        {filteredDonations.length === 0 ? (
          <div className="bg-card">
            <EmptyState
              icon={History}
              title="Aucun don trouvé"
              description="Aucune contribution ne correspond à votre recherche."
            />
          </div>
        ) : (
          <div className="overflow-x-auto bg-card">
            <table className="w-full text-sm text-left">
              <thead
                className="bg-muted/50 border-b"
                style={{
                  borderColor: "var(--border)",
                  color: "var(--muted-foreground)",
                }}
              >
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">
                    Date & Réf.
                  </th>
                  {showDirectoryCols && (
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">
                      Contributeur
                    </th>
                  )}
                  {showDirectoryCols && (
                    <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">
                      Daara
                    </th>
                  )}
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">
                    Campagne
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">
                    Bénéficiaire
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">
                    Montant
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">
                    Méthode
                  </th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody
                className="divide-y divide-border"
                style={{ color: "var(--foreground)" }}
              >
                {paginatedDonations.map((don) => (
                  <tr
                    key={don.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium">
                        {new Date(don.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        REF-{don.id}
                      </div>
                    </td>
                    {showDirectoryCols && (
                      <td className="px-6 py-4">
                        <div className="font-medium line-clamp-1">
                          {don.donor_id ? (
                            <SmartLink
                              href={`/dashboard/users/${don.donor_id}`}
                              className="font-medium"
                            >
                              {don.donor_name || "—"}
                            </SmartLink>
                          ) : (
                            don.donor_name || "—"
                          )}
                        </div>
                      </td>
                    )}
                    {showDirectoryCols && (
                      <td className="px-6 py-4 text-muted-foreground line-clamp-1">
                        {don.donor_daara_name || "—"}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="font-medium line-clamp-1">
                        {don.campaign_id ? (
                          <SmartLink
                            href={`/dashboard/campaigns/${don.campaign_id}`}
                            className="font-medium"
                          >
                            {don.campaign_name}
                          </SmartLink>
                        ) : (
                          don.campaign_name
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {don.beneficiary_name ? (
                        <Badge
                          variant="outline"
                          className="font-medium text-blue-600 bg-blue-50 border-blue-200"
                        >
                          {don.beneficiary_name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground italic">
                          Moi-même
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-lg">
                        {Number(don.amount).toLocaleString()}{" "}
                        <span className="text-[10px]">CFA</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 capitalize">
                        <CreditCard
                          size={14}
                          className="text-muted-foreground"
                        />
                        {don.payment_method.replace("_", " ")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          don.payment_status === "confirmed"
                            ? "confirmed"
                            : don.payment_status === "pending" ||
                                don.payment_status === "pending_wire"
                              ? "pending"
                              : "failed"
                        }
                        className="text-[10px] font-bold uppercase"
                      >
                        {don.payment_status.replace("_", " ")}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
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
                    ? "bg-yessal-violet text-white shadow-lg shadow-yessal-violet/20" 
                    : "text-muted-foreground hover:text-yessal-violet hover:bg-yessal-violet/5"
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
