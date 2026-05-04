"use client";

import { useState } from "react";
import { Phone, Mail, User, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SmartLink } from "@/components/SmartLink";
import { Button } from "@/components/ui/button";

type Collector = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string | null;
};

export function CollectorList({ collectors }: { collectors: Collector[] }) {
  const [selectedCollector, setSelectedCollector] = useState<Collector | null>(
    null,
  );

  return (
    <>
      <ul className="mt-2 space-y-2">
        {collectors.map((c) => (
          <li
            key={c.id}
            className="text-sm p-2 rounded-lg cursor-pointer transition-colors group border border-transparent hover:border-border"
            onClick={() => setSelectedCollector(c)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 truncate">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-muted shrink-0 border">
                  {c.avatar_url ? (
                    <img
                      src={c.avatar_url}
                      alt={c.first_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <User size={14} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col truncate">
                  <div className="font-semibold truncate block">
                    {c.first_name} {c.last_name}
                  </div>
                  <span className="text-muted-foreground text-[10px] block truncate">
                    {c.email}
                  </span>
                </div>
              </div>
              <ExternalLink
                size={12}
                className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={!!selectedCollector}
        onOpenChange={(open) => !open && setSelectedCollector(null)}
      >
        <DialogContent className="max-w-xs rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedCollector && (
            <div className="flex flex-col">
              <div className="bg-yessal-green p-6 text-white flex flex-col items-center gap-3">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30 overflow-hidden">
                  {selectedCollector.avatar_url ? (
                    <img
                      src={selectedCollector.avatar_url}
                      alt={selectedCollector.first_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={40} className="text-white/50" />
                  )}
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-lg leading-tight">
                    {selectedCollector.first_name} {selectedCollector.last_name}
                  </h4>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-70">
                    Collecteur Officiel
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4 bg-card text-center">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <Mail size={16} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">
                      Email
                    </span>
                    <span className="text-sm font-medium truncate">
                      {selectedCollector.email}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <Phone size={16} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-black uppercase text-muted-foreground">
                      Téléphone
                    </span>
                    <span className="text-sm font-medium truncate">
                      {selectedCollector.phone || "Non renseigné"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 mt-4">
                    {selectedCollector.phone && (
                      <Button
                        className="w-full bg-yessal-green hover:bg-yessal-green/90 text-white font-bold uppercase tracking-widest text-[10px] h-12 gap-2 shadow-sm border-none"
                        asChild
                      >
                        <a href={`tel:${selectedCollector.phone}`}>
                          <Phone size={14} />
                          Appeler
                        </a>
                      </Button>
                    )}
                    <Button
                        variant="outline"
                        className="w-full font-bold uppercase tracking-widest text-[10px] h-12"
                        onClick={() => {
                            setSelectedCollector(null);
                            window.location.href = `/dashboard/users/${selectedCollector.id}`;
                        }}
                    >
                        <ExternalLink size={14} className="mr-2" />
                        Détails complets
                    </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
