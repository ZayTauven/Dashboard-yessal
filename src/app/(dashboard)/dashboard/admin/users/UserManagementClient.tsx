"use client";

import { useState, useMemo, useRef } from "react";
import { 
  Search, UserPlus, FileDown, MoreHorizontal, 
  CheckCircle2, XCircle, Shield, Building2, 
  User as UserIcon, Mail, Phone, Filter,
  FileUp, Edit, Trash2, Loader2, Check, ChevronsUpDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExportButton } from "@/components/ExportButton";
import { 
    updateUserStatus, 
    updateUserRole, 
    createUserByAdmin, 
    updateUserAction, 
    deleteUserAction 
} from "@/app/actions/users";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  status: string;
  daara: any;
}

// Custom Searchable Combobox for Daara
function DaaraCombobox({ daaras, value, onChange }: { daaras: any[], value: string, onChange: (val: string) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");

    const filteredDaaras = daaras.filter(d => 
        d.name.toLowerCase().includes(search.toLowerCase()) || 
        d.code?.toLowerCase().includes(search.toLowerCase())
    );

    const selectedDaara = daaras.find(d => d.id.toString() === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between bg-muted/20 border-none h-10"
                >
                    {selectedDaara ? selectedDaara.name : "Choisir un Daara..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <ScrollArea className="h-[200px]">
                    <div className="p-1">
                        <div 
                            className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                            onClick={() => {
                                onChange("");
                                setOpen(false);
                            }}
                        >
                            <Check className={`mr-2 h-4 w-4 ${value === "" ? "opacity-100" : "opacity-0"}`} />
                            Global (Aucun Daara)
                        </div>
                        {filteredDaaras.map((daara) => (
                            <div
                                key={daara.id}
                                className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                onClick={() => {
                                    onChange(daara.id.toString());
                                    setOpen(false);
                                }}
                            >
                                <Check className={`mr-2 h-4 w-4 ${value === daara.id.toString() ? "opacity-100" : "opacity-0"}`} />
                                {daara.name}
                            </div>
                        ))}
                        {filteredDaaras.length === 0 && (
                            <div className="py-6 text-center text-sm text-muted-foreground">Aucun résultat.</div>
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

export function UserManagementClient({ initialUsers, daaras }: { initialUsers: User[], daaras: any[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<number | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Selected Daara ID for new/edit user
  const [selectedDaaraId, setSelectedDaaraId] = useState("");

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = 
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.first_name.toLowerCase().includes(search.toLowerCase()) ||
        u.last_name.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  // ACTIONS
  const handleStatusUpdate = async (id: number, action: 'validate' | 'block') => {
    setLoading(id);
    const { error } = await updateUserStatus(id, action);
    if (!error) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, status: action === 'validate' ? 'active' : 'blocked' } : u));
    }
    setLoading(null);
  };

  const handleRoleUpdate = async (id: number, newRole: string) => {
    setLoading(id);
    const { error } = await updateUserRole(id, newRole);
    if (!error) {
        setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    }
    setLoading(null);
  };

  const handleDeleteUser = async (id: number) => {
      if (!confirm("Supprimer cet utilisateur ?")) return;
      setLoading(id);
      const { error } = await deleteUserAction(id);
      if (!error) {
          setUsers(prev => prev.filter(u => u.id !== id));
      } else {
          alert(error);
      }
      setLoading(null);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt: any) => {
        try {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: "binary" });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data: any[] = XLSX.utils.sheet_to_json(ws);
            
            let successCount = 0;
            for (const row of data) {
                // Expected format: Nom, Prénom, Email, Téléphone, Rôle
                const userData = {
                    first_name: row["Prénom"] || row["first_name"],
                    last_name: row["Nom"] || row["last_name"],
                    email: row["Email"] || row["email"],
                    phone: row["Téléphone"] || row["phone"],
                    role: row["Rôle"] || row["role"] || "member",
                    password: "YessalPassword2024!" // Default pwd
                };
                
                const { error } = await createUserByAdmin(userData);
                if (!error) successCount++;
            }
            alert(`${successCount} utilisateurs importés avec succès.`);
            router.refresh(); // Full refresh to get all new users
        } catch (err) {
            alert("Erreur lors de l'import : " + err);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };
    reader.readAsBinaryString(file);
  };

  const exportData = useMemo(() => {
    return filteredUsers.map(u => ({
        Nom: u.last_name,
        Prénom: u.first_name,
        Email: u.email,
        Téléphone: u.phone,
        Rôle: u.role.toUpperCase(),
        Statut: u.status.toUpperCase(),
        Daara: u.daara?.name || "Global"
    }));
  }, [filteredUsers]);

  const handleSubmitCreate = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData);
      // use selectedDaaraId instead of select value if needed
      const payload = { ...data, daara_id: selectedDaaraId };
      const { error, data: newUser } = await createUserByAdmin(payload);
      if (!error) {
          setIsAddModalOpen(false);
          setUsers(prev => [newUser, ...prev]);
          setSelectedDaaraId("");
      } else {
          alert(error);
      }
  };

  const handleSubmitEdit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editingUser) return;
      const formData = new FormData(e.currentTarget);
      const data = Object.fromEntries(formData);
      const payload = { ...data, daara_id: selectedDaaraId };
      const { error, data: updatedUser } = await updateUserAction(editingUser.id, payload);
      if (!error) {
          setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
          setEditingUser(null);
      } else {
          alert(error);
      }
  };

  return (
    <div className="space-y-6">
      {/* TOOLBAR */}
      <div className="flex flex-col xl:flex-row gap-4 bg-card p-5 rounded-2xl border shadow-sm items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-yessal-green transition-colors" size={18} />
          <Input 
            placeholder="Rechercher par nom, email..." 
            className="pl-10 h-11 bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-yessal-green"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full xl:w-auto justify-end">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[160px] h-11 border-none bg-muted/20">
                    <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="chef_daara">Chef de Daara</SelectItem>
                    <SelectItem value="collector">Collecteur</SelectItem>
                    <SelectItem value="member">Membre</SelectItem>
                </SelectContent>
            </Select>

            <Button 
                variant="outline" 
                className="h-11 border-dashed gap-2 px-4 bg-muted/10 hover:bg-yessal-green/10 hover:text-yessal-green transition-all"
                onClick={() => fileInputRef.current?.click()}
                disabled={isImporting}
            >
                {isImporting ? <Loader2 className="animate-spin" size={18} /> : <FileUp size={18} />}
                Importer
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={handleImportExcel} />

            <ExportButton data={exportData} filename="Yessal_Membres" />

            <Dialog open={isAddModalOpen} onOpenChange={(val) => {
                setIsAddModalOpen(val);
                if (!val) setSelectedDaaraId("");
            }}>
                <DialogTrigger asChild>
                    <Button className="h-11 bg-yessal-green hover:bg-green-700 text-white gap-2 px-6 border-none shadow-lg shadow-yessal-green/20">
                        <UserPlus size={18} />
                        Nouveau
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Créer un compte</DialogTitle>
                        <DialogDescription>Remplissez les informations pour ajouter un membre manuellement.</DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4 py-4" onSubmit={handleSubmitCreate}>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Prénom</label>
                                <Input name="first_name" placeholder="Ex: Moussa" required className="bg-muted/10" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Nom</label>
                                <Input name="last_name" placeholder="Ex: Diop" required className="bg-muted/10" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email professionnel</label>
                            <Input name="email" type="email" placeholder="email@exemple.com" required className="bg-muted/10" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Mot de passe initial</label>
                            <Input name="password" type="password" placeholder="••••••••" required className="bg-muted/10" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Rôle</label>
                                <Select name="role" defaultValue="member">
                                    <SelectTrigger className="bg-muted/10 border-none">
                                        <SelectValue placeholder="Rôle" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Administrateur</SelectItem>
                                        <SelectItem value="chef_daara">Chef de Daara</SelectItem>
                                        <SelectItem value="collector">Collecteur</SelectItem>
                                        <SelectItem value="member">Membre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Daara</label>
                                <DaaraCombobox daaras={daaras} value={selectedDaaraId} onChange={setSelectedDaaraId} />
                            </div>
                        </div>
                        <DialogFooter className="mt-6">
                            <Button type="submit" className="w-full bg-yessal-green text-white border-none py-6 font-bold uppercase tracking-widest text-xs">Créer l'utilisateur</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
      </div>

      {/* EDIT MODAL */}
      <Dialog open={!!editingUser} onOpenChange={(val) => {
          if (!val) {
              setEditingUser(null);
              setSelectedDaaraId("");
          }
      }}>
          <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle>Modifier l'utilisateur</DialogTitle>
                <DialogDescription>Modifiez les informations de {editingUser?.first_name} {editingUser?.last_name}.</DialogDescription>
            </DialogHeader>
            {editingUser && (
                <form className="space-y-4 py-4" onSubmit={handleSubmitEdit}>
                    <div className="grid grid-cols-2 gap-4">
                        <Input name="first_name" defaultValue={editingUser.first_name} required />
                        <Input name="last_name" defaultValue={editingUser.last_name} required />
                    </div>
                    <Input name="email" defaultValue={editingUser.email} type="email" required />
                    <Input name="phone" defaultValue={editingUser.phone} placeholder="Téléphone" />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <Select name="role" defaultValue={editingUser.role}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Administrateur</SelectItem>
                                <SelectItem value="chef_daara">Chef de Daara</SelectItem>
                                <SelectItem value="collector">Collecteur</SelectItem>
                                <SelectItem value="member">Membre</SelectItem>
                            </SelectContent>
                        </Select>
                        <DaaraCombobox daaras={daaras} value={selectedDaaraId || editingUser.daara?.id?.toString() || ""} onChange={setSelectedDaaraId} />
                    </div>
                    
                    <DialogFooter className="mt-6">
                        <Button type="submit" className="w-full bg-yessal-green text-white border-none py-6">Sauvegarder les modifications</Button>
                    </DialogFooter>
                </form>
            )}
          </DialogContent>
      </Dialog>

      {/* USERS LIST */}
      <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
        <ScrollArea className="w-full">
            <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b">
                    <tr>
                        <th className="px-6 py-4">Utilisateur</th>
                        <th className="px-6 py-4">Rôle</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Daara</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-muted/10">
                    {filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-muted/10 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-yessal-green/10 text-yessal-green flex items-center justify-center font-bold text-xs border border-yessal-green/20">
                                        {user.first_name?.[0]}{user.last_name?.[0]}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">{user.first_name} {user.last_name}</span>
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail size={10} /> {user.email}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 px-2 gap-1 text-xs hover:bg-yessal-green/10 hover:text-yessal-green transition-all border-none">
                                            <Badge variant="outline" className="capitalize border-none bg-accent/30 font-bold px-2">{user.role.replace('_', ' ')}</Badge>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuLabel>Changer le rôle</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, "admin")}>Administrateur</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, "chef_daara")}>Chef de Daara</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, "collector")}>Collecteur</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleUpdate(user.id, "member")}>Membre</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </td>
                            <td className="px-6 py-4">
                                <Badge className={`text-[10px] gap-1 px-2 py-0.5 border-none font-bold ${
                                    user.status === 'active' ? 'bg-green-100 text-green-700' : 
                                    user.status === 'pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {user.status === 'active' ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                                    {user.status.toUpperCase()}
                                </Badge>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                    <Building2 size={14} className="text-yessal-green/50" />
                                    {user.daara?.name || "Global"}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 border-none"
                                        onClick={() => {
                                            setEditingUser(user);
                                            setSelectedDaaraId(user.daara?.id?.toString() || "");
                                        }}
                                    >
                                        <Edit size={14} />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-red-600 hover:bg-red-50 border-none"
                                        onClick={() => handleDeleteUser(user.id)}
                                        disabled={loading === user.id}
                                    >
                                        {loading === user.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 border-none">
                                                <MoreHorizontal size={14} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleStatusUpdate(user.id, 'validate')}>
                                                Valider le compte
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleStatusUpdate(user.id, 'block')} className="text-red-600">
                                                Bloquer l'accès
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </ScrollArea>
        {filteredUsers.length === 0 && (
            <div className="p-20 text-center text-muted-foreground italic text-sm">
                Aucun utilisateur ne correspond à votre recherche.
            </div>
        )}
      </div>
    </div>
  );
}
