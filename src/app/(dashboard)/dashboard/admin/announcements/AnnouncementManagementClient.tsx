"use client";

import { useState } from "react";
import { 
  Megaphone, Plus, Trash2, Calendar, 
  Globe, Building2, MoreHorizontal, CheckCircle2,
  AlertCircle, AlertTriangle, Info, UserCheck, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createAnnouncement, deleteAnnouncement } from "@/app/actions/announcements";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Announcement {
  id: number;
  title: string;
  content: string;
  target: string;
  daara_name: string;
  urgency: 'info' | 'warning' | 'critical';
  target_role: string;
  is_published: boolean;
  created_at: string;
}

export function AnnouncementManagementClient({ initialAnnouncements, daaras }: { initialAnnouncements: Announcement[], daaras: any[] }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette annonce ?")) return;
    const { error } = await deleteAnnouncement(id);
    if (!error) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
    }
  };

  const getUrgencyIcon = (urgency: string) => {
      switch (urgency) {
          case 'critical': return <AlertCircle size={14} className="text-red-500" />;
          case 'warning': return <AlertTriangle size={14} className="text-orange-500" />;
          default: return <Info size={14} className="text-blue-500" />;
      }
  };

  return (
    <div className="space-y-8">
      {/* HEADER ACTIONS */}
      <div className="flex justify-between items-center bg-card p-6 rounded-2xl border shadow-sm">
        <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-black flex gap-2 items-center tracking-tight">
                <Megaphone size={24} className="text-yessal-green" /> 
                Centre des Annonces
            </h2>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Gérez la communication officielle du réseau</p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
                <Button className="bg-yessal-green hover:bg-green-700 text-white gap-2 px-6 h-12 rounded-xl shadow-lg shadow-yessal-green/20 border-none transition-all hover:scale-105 active:scale-95">
                    <Plus size={18} /> Nouvelle Diffusion
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-background border-none shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black">Diffuser un message</DialogTitle>
                    <DialogDescription className="font-medium text-muted-foreground">Ciblez précisément les membres devant recevoir cette information.</DialogDescription>
                </DialogHeader>
                <form className="space-y-5 py-4" onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const data = Object.fromEntries(formData);
                    const { error, data: newAnn } = await createAnnouncement(data);
                    if (!error) {
                        setAnnouncements(prev => [newAnn, ...prev]);
                        setIsAddModalOpen(false);
                    } else {
                        alert(error);
                    }
                }}>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Sujet de l'annonce</label>
                        <Input name="title" placeholder="Titre accrocheur..." required className="bg-muted/10 h-11 border-none focus-visible:ring-1 focus-visible:ring-yessal-green" />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Message complet</label>
                        <Textarea name="content" placeholder="Que voulez-vous dire à la communauté ?" className="min-h-[120px] bg-muted/10 border-none focus-visible:ring-1 focus-visible:ring-yessal-green" required />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Niveau d'urgence</label>
                            <Select name="urgency" defaultValue="info">
                                <SelectTrigger className="bg-muted/10 border-none h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="info">ℹ️ Information (Standard)</SelectItem>
                                    <SelectItem value="warning">⚠️ Avertissement (Important)</SelectItem>
                                    <SelectItem value="critical">🚨 Critique (Urgent)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Cible (Rôle)</label>
                            <Select name="target_role" defaultValue="all">
                                <SelectTrigger className="bg-muted/10 border-none h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tout le monde</SelectItem>
                                    <SelectItem value="member">Membres uniquement</SelectItem>
                                    <SelectItem value="chef_daara">Responsables Daara</SelectItem>
                                    <SelectItem value="collector">Collecteurs</SelectItem>
                                    <SelectItem value="admin">Administrateurs</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Portée Géographique / Structure</label>
                            <Select name="target" defaultValue="global">
                                <SelectTrigger className="bg-muted/10 border-none h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="global">Réseau Global (Tout Yessal)</SelectItem>
                                    <SelectItem value="daara_only">Spécifique à un Daara</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 tracking-widest">Entité concernée</label>
                            <Select name="daara">
                                <SelectTrigger className="bg-muted/10 border-none h-11">
                                    <SelectValue placeholder="Aucune" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="NONE">Toutes les entités</SelectItem>
                                    {daaras.map(d => (
                                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    
                    <DialogFooter className="mt-8">
                        <Button type="submit" className="w-full bg-yessal-green text-white border-none py-6 font-black uppercase tracking-widest">Lancer la diffusion</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>

      {/* LIST OF ANNOUNCEMENTS */}
      <div className="space-y-4">
        {announcements.map((ann) => (
            <div key={ann.id} className="bg-card border-none shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden group">
                <div className="p-1 flex flex-col md:flex-row md:items-center gap-6">
                    {/* Urgency side indicator */}
                    <div className={`w-1 md:w-2 h-full absolute left-0 top-0 ${
                        ann.urgency === 'critical' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 
                        ann.urgency === 'warning' ? 'bg-orange-500' : 'bg-blue-400'
                    }`} />

                    <div className="flex-1 flex flex-col md:flex-row items-start md:items-center gap-6 p-5">
                        {/* Title & Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                {getUrgencyIcon(ann.urgency)}
                                <h3 className="font-bold truncate text-base tracking-tight">{ann.title}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 whitespace-pre-wrap">{ann.content}</p>
                        </div>

                        {/* Badges / Stats */}
                        <div className="flex flex-wrap items-center gap-2">
                             <Badge className={`uppercase text-[9px] font-black tracking-widest border-none px-2 py-1 ${ann.target === 'global' ? 'bg-blue-50 text-blue-600' : 'bg-yessal-green/10 text-yessal-green'}`}>
                                {ann.target === 'global' ? <Globe size={10} className="mr-1" /> : <Building2 size={10} className="mr-1" />}
                                {ann.target === 'global' ? "Global" : ann.daara_name}
                            </Badge>
                            
                            <Badge className="bg-muted/30 text-muted-foreground uppercase text-[9px] font-black tracking-widest border-none px-2 py-1">
                                <UserCheck size={10} className="mr-1" />
                                {ann.target_role === 'all' ? "Tout public" : ann.target_role.replace('_', ' ')}
                            </Badge>

                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold px-3 py-1 bg-muted/10 rounded-full">
                                <Calendar size={10} /> {new Date(ann.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        {/* Actions */}
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-red-400 hover:text-red-600 hover:bg-red-50 border-none transition-all" onClick={() => handleDelete(ann.id)}>
                            <Trash2 size={16} />
                        </Button>
                    </div>
                </div>
            </div>
        ))}
        
        {announcements.length === 0 && (
            <div className="py-20 text-center bg-card rounded-2xl border border-dashed text-muted-foreground italic text-sm">
                Aucun historique d'annonce disponible.
            </div>
        )}
      </div>
    </div>
  );
}
