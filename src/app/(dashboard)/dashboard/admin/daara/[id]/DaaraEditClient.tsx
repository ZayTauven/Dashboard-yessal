"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updateDaara } from "@/app/actions/daara";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Building2, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type DaaraData = {
  id: number;
  name: string;
  description?: string | null;
  is_active?: boolean;
  ldd?: {
    id: number;
    code: string;
    name: string;
    location?: string | null;
  } | null;
};

export function DaaraEditClient({ daara }: { daara: DaaraData }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setErrorMsg("");
    setSuccessMsg("");
    startTransition(async () => {
      const res = await updateDaara(daara.id, {
        name: String(formData.get("name") || "").trim(),
        description:
          String(formData.get("description") || "").trim() || undefined,
        is_active: formData.get("is_active") === "on",
      });
      if (res.error) {
        setErrorMsg(res.error);
        return;
      }
      setSuccessMsg("Daara mis à jour avec succès.");
      setTimeout(() => {
        router.push("/dashboard/admin/daara");
        router.refresh();
      }, 1000);
    });
  };

  return (
    <div className="p-8 max-w-xl mx-auto flex flex-col gap-8">
      <Button variant="ghost" className="w-fit gap-2 -ml-2" asChild>
        <Link href="/dashboard/admin/daara">
          <ArrowLeft size={16} />
          Retour à la liste
        </Link>
      </Button>

      <div>
        <h1
          className="text-3xl font-semibold tracking-tight flex items-center gap-2"
          style={{ color: "var(--foreground)" }}
        >
          <Building2 size={28} style={{ color: "var(--primary)" }} />
          Modifier le Daara
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {daara.name}
        </p>
      </div>

      {/* LDD info — lecture seule */}
      {daara.ldd && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl border bg-muted/20"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="p-2 rounded-lg bg-yessal-violet/10 text-yessal-violet">
            <Layers size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Ligue de Daara (LDD) — non modifiable ici
            </span>
            <span className="text-sm font-bold">
              [{daara.ldd.code}] {daara.ldd.name}
            </span>
            {daara.ldd.location && (
              <span className="text-xs text-muted-foreground">{daara.ldd.location}</span>
            )}
          </div>
          <Badge variant="outline" className="ml-auto text-[10px] bg-green-50 text-green-600 border-green-100">
            Actif
          </Badge>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Nom du Daara <span className="text-red-500">*</span>
          </label>
          <Input name="name" defaultValue={daara.name} required />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Description (Optionnel)
          </label>
          <textarea
            name="description"
            defaultValue={daara.description ?? ""}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[120px] outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderColor: "var(--border)" }}
            placeholder="Précisions géographiques ou historiques..."
          />
        </div>

        <label className="flex items-center gap-2 text-sm cursor-pointer p-3 rounded-lg border bg-muted/20" style={{ borderColor: "var(--border)" }}>
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={daara.is_active !== false}
            className="rounded border"
          />
          <span className="font-medium">Daara actif</span>
          <span className="text-xs text-muted-foreground ml-1">
            (si décoché, ce Daara n'apparaît plus lors des inscriptions)
          </span>
        </label>

        {errorMsg && (
          <p className="text-sm text-red-600 font-medium p-3 bg-red-50 rounded-lg">{errorMsg}</p>
        )}
        {successMsg && (
          <p className="text-sm text-green-600 font-medium p-3 bg-green-50 rounded-lg">{successMsg}</p>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full"
          style={{ background: "var(--primary)", color: "white" }}
        >
          {isPending ? "Enregistrement…" : "Enregistrer les modifications"}
        </Button>
      </form>
    </div>
  );
}
