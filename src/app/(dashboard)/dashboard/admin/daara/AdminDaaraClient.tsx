"use client";

import { useState, useMemo, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  createDaara,
  deleteDaara,
  importDaaraExcel,
  getLDDs,
} from "@/app/actions/daara";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SmartLink } from "@/components/SmartLink";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Building2,
  AlertCircle,
  Eye,
  Edit,
  Upload,
  CheckCircle,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AdminDaaraClient({ initialDaaras }: { initialDaaras: any[] }) {
  const [daaras, setDaaras] = useState(initialDaaras);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState("");

  // LDDs state for the form selector
  const [ldds, setLdds] = useState<any[]>([]);
  const [lddsLoading, setLddsLoading] = useState(true);

  // Pagination, Sort, Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedDaaras = useMemo(() => {
    let sortableItems = [...daaras];

    if (searchTerm) {
      sortableItems = sortableItems.filter(
        (daara) =>
          (daara.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
          (daara.ldd?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
          (daara.ldd?.code?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false),
      );
    }

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "ldd_code") {
          aValue = a.ldd?.code || "";
          bValue = b.ldd?.code || "";
        } else if (sortConfig.key === "members_count") {
          aValue = a.members_count ?? a.memberCount ?? 0;
          bValue = b.members_count ?? b.memberCount ?? 0;
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [daaras, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedDaaras.length / itemsPerPage);
  const paginatedDaaras = filteredAndSortedDaaras.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    getLDDs().then((res) => {
      if (res.data) {
        // Handle paginated or flat array response
        const arr = Array.isArray(res.data)
          ? res.data
          : ((res.data as any).results ?? []);
        setLdds(arr);
      }
      setLddsLoading(false);
    });
  }, []);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportSuccessMsg("");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);

    const res = await importDaaraExcel(formData);
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      setImportSuccessMsg(res.data?.success || "Importation réussie.");
      setTimeout(() => setImportSuccessMsg(""), 5000);
      window.location.reload();
    }
    setIsImporting(false);
  };

  const handleSubmit = async (formData: FormData) => {
    setErrorMsg("");
    startTransition(async () => {
      const res = await createDaara(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setDaaras((prev) => [...prev, res.data]);
        // Reset form
        const form = document.getElementById(
          "daara-create-form",
        ) as HTMLFormElement;
        form?.reset();
      }
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce Daara ?")) return;
    startTransition(async () => {
      const res = await deleteDaara(id);
      if (!res.error) {
        setDaaras((prev) => prev.filter((d) => d.id !== id));
      }
    });
  };

  return (
    <div className="grid grid-cols-3 gap-8">
      {/* LISTE DES DAARAS */}
      <div className="col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div className="relative w-64">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              placeholder="Rechercher un Daara..."
              className="pl-9 h-10 bg-card border"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs text-muted-foreground font-medium">
            {filteredAndSortedDaaras.length}{" "}
            {filteredAndSortedDaaras.length > 1
              ? "Daaras trouvés"
              : "Daara trouvé"}
          </div>
        </div>

        <div
          className="bg-card rounded-2xl border shadow-sm overflow-hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead
                  className="font-bold uppercase text-[10px] tracking-widest pl-6 cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("ldd_code")}
                >
                  <div className="flex items-center gap-1">
                    LDD / Code <ArrowUpDown size={12} />
                  </div>
                </TableHead>
                <TableHead
                  className="font-bold uppercase text-[10px] tracking-widest cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Nom du Daara <ArrowUpDown size={12} />
                  </div>
                </TableHead>
                <TableHead
                  className="font-bold uppercase text-[10px] tracking-widest cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("members_count")}
                >
                  <div className="flex items-center gap-1">
                    Membres <ArrowUpDown size={12} />
                  </div>
                </TableHead>
                <TableHead
                  className="font-bold uppercase text-[10px] tracking-widest cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("is_active")}
                >
                  <div className="flex items-center gap-1">
                    Statut <ArrowUpDown size={12} />
                  </div>
                </TableHead>
                <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest pr-6">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDaaras.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-16 text-muted-foreground italic text-sm"
                  >
                    {daaras.length === 0
                      ? "Aucun Daara enregistré. Importez un fichier Excel ou créez-en un manuellement."
                      : "Aucun résultat trouvé pour votre recherche."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedDaaras.map((daara: any) => (
                  <TableRow key={daara.id}>
                    <TableCell className="pl-6">
                      <div className="flex flex-col">
                        <span className="font-bold text-yessal-green text-xs">
                          {daara.ldd?.code ?? "—"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {daara.ldd?.name ?? ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <SmartLink
                        href={`/dashboard/daara`}
                        className="font-medium"
                      >
                        {daara.name}
                      </SmartLink>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {daara.members_count ?? daara.memberCount ?? "—"}{" "}
                        membres
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          daara.is_active
                            ? "bg-green-50 text-green-600 border-green-100"
                            : "bg-red-50 text-red-500 border-red-100"
                        }
                      >
                        {daara.is_active ? "Actif" : "Inactif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                      >
                        <Link href={`/dashboard/admin/daara/${daara.id}`}>
                          <Eye size={16} />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="text-grey-400 hover:text-grey-600 hover:bg-green-50"
                      >
                        <Link href={`/dashboard/admin/daara/${daara.id}`}>
                          <Edit size={16} />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(daara.id)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-card p-4 rounded-2xl border shadow-sm">
            <span className="text-xs text-muted-foreground">
              Page <span className="font-bold">{currentPage}</span> sur{" "}
              <span className="font-bold">{totalPages}</span>
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} /> Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Suivant <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* FORMULAIRE D'AJOUT */}
      <div className="col-span-1">
        <div
          className="bg-card p-6 rounded-2xl border shadow-sm sticky top-8"
          style={{ borderColor: "var(--border)" }}
        >
          {importSuccessMsg && (
            <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle size={14} /> {importSuccessMsg}
            </div>
          )}

          <div className="flex items-center gap-2 mb-6 justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-yessal-green/10 text-yessal-green">
                <Building2 size={20} />
              </div>
              <h3 className="text-lg font-bold">Nouveau Daara</h3>
            </div>

            <label
              className="cursor-pointer flex items-center justify-center p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground transition-all"
              title="Importer fichier Excel"
            >
              {isImporting ? (
                <div className="h-4 w-4 rounded-full border-2 border-yessal-green border-t-transparent animate-spin" />
              ) : (
                <Upload size={16} />
              )}
              <input
                type="file"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleImport}
                disabled={isImporting}
              />
            </label>
          </div>

          <form
            id="daara-create-form"
            action={handleSubmit}
            className="space-y-4"
          >
            {/* Sélecteur LDD — champ obligatoire */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1">
                <Layers size={11} /> LDD (Ligue de Daara)
                <span className="text-red-500">*</span>
              </label>
              {lddsLoading ? (
                <div className="h-10 rounded-md bg-muted animate-pulse" />
              ) : ldds.length === 0 ? (
                <div className="text-xs text-orange-600 p-2 bg-orange-50 rounded-md">
                  Aucune LDD trouvée. Importez d'abord un fichier Excel.
                </div>
              ) : (
                <select
                  name="ldd_id"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-yessal-green/50"
                >
                  <option value="">Choisir une LDD...</option>
                  {ldds.map((ldd: any) => (
                    <option key={ldd.id} value={ldd.id}>
                      [{ldd.code}] {ldd.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Nom du Daara <span className="text-red-500">*</span>
              </label>
              <Input
                name="name"
                placeholder="Ex: Daara de Dakar Plateau"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                Description (Optionnel)
              </label>
              <textarea
                name="description"
                className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[80px] outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Précisions géographiques ou historiques..."
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle size={14} /> {errorMsg}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 gap-2 mt-4"
              disabled={isPending || ldds.length === 0}
              style={{ background: "var(--yessal-green)", color: "white" }}
            >
              <Plus size={18} />{" "}
              {isPending ? "Création..." : "Ajouter le Daara"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
