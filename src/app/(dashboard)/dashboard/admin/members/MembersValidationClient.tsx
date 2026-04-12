"use client";

import { useState, useTransition } from "react";
import { updateUserStatus } from "@/app/actions/users";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserCheck, UserX, Clock, Search, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";

export function MembersValidationClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState("");

  const handleAction = async (userId: number, action: 'validate' | 'block') => {
    startTransition(async () => {
        const res = await updateUserStatus(userId, action);
        if (!res.error) {
            setUsers(prev => prev.map(u => 
                u.id === userId 
                ? { ...u, status: action === 'validate' ? 'active' : 'blocked' } 
                : u
            ));
        }
    });
  };

  const filtered = users.filter(u => 
      u.email.toLowerCase().includes(filter.toLowerCase()) || 
      u.first_name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-xl border border-dashed shadow-sm" style={{ borderColor: "var(--border)" }}>
           <div className="flex gap-2 items-center">
                <Search size={18} className="text-muted-foreground" />
                <Input 
                    placeholder="Filtrer par nom ou email..." 
                    className="border-none bg-transparent focus-visible:ring-0 min-w-[300px]"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
           </div>
           <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <span className="flex items-center gap-1"><Clock size={14} className="text-orange-500" /> {users.filter(u => u.status === 'pending').length} En attente</span>
                <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-green-500" /> {users.filter(u => u.status === 'active').length} Approuvés</span>
           </div>
      </div>

      <div className="bg-card rounded-2xl border shadow-lg overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest">Utilisateur</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest">Daara</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest">Rôle</TableHead>
              <TableHead className="font-bold uppercase text-[10px] tracking-widest">Statut</TableHead>
              <TableHead className="text-right font-bold uppercase text-[10px] tracking-widest">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">
                        Aucun utilisateur trouvé.
                    </TableCell>
                </TableRow>
            ) : (
                filtered.map((user: any) => (
                <TableRow key={user.id} className="hover:bg-muted/10">
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-yessal-green text-white" style={{ background: "var(--yessal-green)" }}>
                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-bold text-sm">{user.first_name} {user.last_name}</div>
                                <div className="text-[10px] text-muted-foreground">{user.email}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <span className="text-xs font-medium">{user.daara?.name || "Sans Daara"}</span>
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline" className="capitalize text-[10px]">{user.role}</Badge>
                    </TableCell>
                    <TableCell>
                        <Badge variant={
                            user.status === 'pending' ? 'secondary' : 
                            user.status === 'active' ? 'default' : 'destructive'
                        } className="capitalize text-[10px]">
                            {user.status === 'pending' ? 'En attente' : 
                             user.status === 'active' ? 'Activé' : 'Bloqué'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            {user.status !== 'active' && (
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 gap-1 text-green-600 border-green-200 bg-green-50 shadow-none hover:bg-green-100 hover:text-green-700" 
                                    onClick={() => handleAction(user.id, 'validate')}
                                    disabled={isPending}
                                >
                                    <UserCheck size={14} /> Valider
                                </Button>
                            )}
                            {user.status !== 'blocked' && (
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-8 gap-1 text-red-600 border-red-200 bg-red-50 shadow-none hover:bg-red-100 hover:text-red-700" 
                                    onClick={() => handleAction(user.id, 'block')}
                                    disabled={isPending}
                                >
                                    <UserX size={14} /> Bloquer
                                </Button>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
