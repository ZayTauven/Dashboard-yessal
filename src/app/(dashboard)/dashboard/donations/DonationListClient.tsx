"use client";

import { CreditCard, History, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo } from "react";
import { ExportButton } from "@/components/ExportButton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function DonationListClient({ initialDonations }: { initialDonations: any[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredDonations = useMemo(() => {
    return initialDonations.filter(don => {
        const matchesSearch = 
            don.campaign_name?.toLowerCase().includes(search.toLowerCase()) ||
            don.beneficiary_name?.toLowerCase().includes(search.toLowerCase()) ||
            don.id.toString().includes(search);
        const matchesStatus = statusFilter === "all" || don.payment_status === statusFilter;
        return matchesSearch && matchesStatus;
    });
  }, [initialDonations, search, statusFilter]);

  const exportData = useMemo(() => {
    return filteredDonations.map(don => ({
        Date: new Date(don.created_at).toLocaleDateString(),
        Référence: `REF-${don.id}`,
        Campagne: don.campaign_name,
        Bénéficiaire: don.beneficiary_name || "Moi-même",
        Montant: don.amount,
        Méthode: don.payment_method.toUpperCase(),
        Statut: don.payment_status.toUpperCase()
    }));
  }, [filteredDonations]);

  return (
    <div className="space-y-6">
      {/* FILTER BAR */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-muted/20 p-4 rounded-xl border" style={{ borderColor: "var(--border)" }}>
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-yessal-green transition-colors" size={16} />
          <Input 
            placeholder="Rechercher par campagne, bénéficiaire ou référence..." 
            className="pl-10 bg-card border-none focus-visible:ring-1 focus-visible:ring-yessal-green h-11" 
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
                    <SelectItem value="failed">Échoué</SelectItem>
                </SelectContent>
            </Select>
            <ExportButton data={exportData} filename="Yessal_Dons_Export" />
        </div>
      </div>

      {/* TABLE */}
      <div className="border rounded-xl overflow-hidden shadow-sm" style={{ borderColor: "var(--border)" }}>
        {filteredDonations.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center gap-3 bg-card">
            <History className="text-muted-foreground opacity-20" size={48} />
            <p className="text-muted-foreground italic">Aucun don ne correspond à votre recherche.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-card">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
                <tr>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Date & Réf.</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Campagne</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Bénéficiaire</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Montant</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Méthode</th>
                  <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border" style={{ color: "var(--foreground)" }}>
                {filteredDonations.map((don: any) => (
                  <tr key={don.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{new Date(don.created_at).toLocaleDateString()}</div>
                      <div className="text-[10px] text-muted-foreground">REF-{don.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium line-clamp-1">{don.campaign_name}</div>
                    </td>
                    <td className="px-6 py-4">
                       {don.beneficiary_name ? (
                           <Badge variant="outline" className="font-medium text-blue-600 bg-blue-50 border-blue-200">
                                {don.beneficiary_name}
                           </Badge>
                       ) : (
                           <span className="text-muted-foreground italic">Moi-même</span>
                       )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-lg">{Number(don.amount).toLocaleString()} <span className="text-[10px]">CFA</span></div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 capitalize">
                         <CreditCard size={14} className="text-muted-foreground" />
                         {don.payment_method.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        don.payment_status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                        don.payment_status === 'pending' ? 'bg-orange-100 text-orange-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                         {don.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
