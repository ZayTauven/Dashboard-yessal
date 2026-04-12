import { searchMembers } from "@/app/actions/users";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function MembersPage() {
  const { data: members } = await searchMembers("a"); // Search all for demo

  return (
    <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          Membres de la Communauté
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Annuaire des membres inscrits sur la plateforme Yessal Gui.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {members?.map((m: any) => (
            <div key={m.id} className="bg-card border rounded-2xl p-6 flex items-center gap-4 shadow-sm" style={{ borderColor: "var(--border)" }}>
                <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-yessal-green text-white" style={{ background: "var(--yessal-green)" }}>
                        {m.first_name?.[0]}{m.last_name?.[0]}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <div className="font-bold truncate text-lg">{m.first_name} {m.last_name}</div>
                    <div className="text-xs text-muted-foreground truncate mb-2">{m.email}</div>
                    <Badge variant="secondary" className="capitalize text-[10px] py-0">{m.role}</Badge>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
