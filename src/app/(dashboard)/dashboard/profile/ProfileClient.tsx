"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, User, Smartphone, Mail, Building, BadgeCheck, Camera, Loader2 } from "lucide-react";
import { updateProfile } from "@/app/actions/users";
import { useRouter } from "next/navigation";

export function ProfileClient({ profile }: { profile: any }) {
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("avatar", file);

    const { error } = await updateProfile(formData);
    if (!error) {
        router.refresh();
    } else {
        alert(error);
    }
    setIsUploading(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
        const { error } = await updateProfile(formData);
        if (error) {
            alert(error);
        } else {
            router.refresh();
        }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* SIDEBAR : INFO STATS */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-card p-8 rounded-2xl border flex flex-col items-center text-center shadow-sm" style={{ borderColor: "var(--border)" }}>
         <div className="relative group">
            <Avatar className="h-32 w-32 mb-4 ring-4 ring-yessal-green/20 overflow-hidden shadow-2xl transition-transform group-hover:scale-105 duration-500">
                <AvatarImage src={profile.avatar} className="object-cover" />
                <AvatarFallback className="bg-yessal-green text-white text-3xl font-black">
                    {profile.first_name?.[0]}{profile.last_name?.[0]}
                </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-6 right-2 h-10 w-10 bg-white shadow-xl rounded-full flex items-center justify-center cursor-pointer border border-yessal-green/20 hover:scale-110 transition-all text-yessal-green">
                {isUploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
            </label>
         </div>
           <h3 className="text-xl font-bold">{profile.first_name} {profile.last_name}</h3>
           <BadgeCheck className="text-blue-500 mt-1" size={20} />
           <p className="text-xs text-muted-foreground mt-2 uppercase font-bold tracking-widest">{profile.role}</p>
           
           <div className="mt-6 w-full pt-6 border-t font-semibold flex items-center justify-center gap-2" style={{ borderColor: "var(--border)" }}>
                <Building size={16} className="text-muted-foreground" />
                <span className="text-sm">{profile.daara_name || "Daara Principal"}</span>
           </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border shadow-sm space-y-4" style={{ borderColor: "var(--border)" }}>
            <h4 className="font-bold flex items-center gap-2 border-b pb-3 mb-2" style={{ borderColor: "var(--border)" }}>
                <Shield size={16} className="text-yessal-green" style={{ color: "var(--yessal-green)" }} /> Sécurité
            </h4>
            <div className="flex justify-between items-center text-xs">
                <span>Authentification 2FA</span>
                <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">Désactivée</span>
            </div>
            <Button variant="outline" className="w-full text-[10px] uppercase font-bold tracking-wider py-5 border-dashed border-2">
                Activer la Double Auth
            </Button>
        </div>
      </div>

      {/* MAIN : FORM */}
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-card p-8 rounded-2xl border shadow-sm" style={{ borderColor: "var(--border)" }}>
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                <User size={20} className="text-yessal-green" style={{ color: "var(--yessal-green)" }} /> Informations du compte
            </h3>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Prénom</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <Input name="first_name" defaultValue={profile.first_name} className="pl-10" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Nom</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                            <Input name="last_name" defaultValue={profile.last_name} className="pl-10" />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Email Professionnel / Personnel</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input defaultValue={profile.email} className="pl-10 bg-muted/20" readOnly />
                    </div>
                    <p className="text-[10px] text-muted-foreground">L'email ne peut pas être modifié sans contacter l'admin.</p>
                </div>

                <div className="space-y-2">
                    <Label>Numéro de téléphone</Label>
                    <div className="relative">
                        <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <Input name="phone" defaultValue={profile.phone || "+221"} className="pl-10" />
                    </div>
                </div>

                <div className="pt-6 border-t flex justify-end" style={{ borderColor: "var(--border)" }}>
                    <Button disabled={isPending} style={{ background: "var(--yessal-green)", color: "white", paddingLeft: "40px", paddingRight: "40px" }}>
                        Mettre à jour
                    </Button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}
