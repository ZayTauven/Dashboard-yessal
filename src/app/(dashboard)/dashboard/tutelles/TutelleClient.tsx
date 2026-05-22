"use client";

import { useState, useTransition } from "react";
import { addTutelle } from "@/app/actions/tutelles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function TutelleClient({ initialTutelles }: { initialTutelles: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  async function handleAdd(formData: FormData) {
    setErrorMsg("");
    startTransition(async () => {
      const res = await addTutelle(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.success) {
        setIsOpen(false);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button
          className="gap-2"
          style={{
            background: "var(--primary)",
            color: "#FAFAF8",
          }}
          onClick={() => setIsOpen(true)}
        >
          <Plus size={16} /> Ajouter un proche
        </Button>

        {isOpen && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="w-full max-w-[425px] rounded-xl border bg-background p-6 shadow-lg"
              style={{ borderColor: "var(--border)" }}
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                    Nouveau proche
                  </h2>
                  <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                    Enregistrez un membre sous votre tutelle. Vous pourrez ensuite payer des dons en son nom.
                  </p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  Fermer
                </Button>
              </div>

              <form action={handleAdd} className="grid gap-4 py-4">
                <div className="flex flex-col gap-1.5 text-left">
                  <Label htmlFor="firstName" style={{ color: "var(--foreground)" }}>Prénom</Label>
                  <Input id="firstName" name="firstName" required />
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <Label htmlFor="lastName" style={{ color: "var(--foreground)" }}>Nom</Label>
                  <Input id="lastName" name="lastName" required />
                </div>
                <div className="flex flex-col gap-1.5 text-left">
                  <Label htmlFor="relation" style={{ color: "var(--foreground)" }}>Lien de parenté</Label>
                  <Input id="relation" name="relation" placeholder="ex: Fils, Fille, Épouse..." required />
                </div>
                {errorMsg && <p className="text-sm text-red-500 font-medium">{errorMsg}</p>}
                <div className="flex justify-end mt-4">
                  <Button type="submit" disabled={isPending} style={{ background: "var(--primary)", color: "#FAFAF8" }}>
                    {isPending ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <div className="border rounded-md" style={{ borderColor: "var(--border)" }}>
        {initialTutelles.length === 0 ? (
          <div className="p-8 text-center" style={{ color: "var(--muted-foreground)" }}>
            Vous n'avez pas encore enregistré de proches sous tutelle.
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="border-b bg-muted/50" style={{ borderColor: "var(--border)", color: "var(--muted-foreground)" }}>
              <tr>
                <th className="px-4 py-3 font-medium">Prénom Nom</th>
                <th className="px-4 py-3 font-medium">Lien</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Compte lié</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {initialTutelles.map((tutelle: any) => (
                <tr key={tutelle.id} className="border-b last:border-0" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                  <td className="px-4 py-3 font-medium">
                    {tutelle.first_name} {tutelle.last_name}
                  </td>
                  <td className="px-4 py-3 capitalize">{tutelle.relation}</td>
                  <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                    {tutelle.linked_user || "Non lié"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="active" className="text-xs">
                      Actif
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
