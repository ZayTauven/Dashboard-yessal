import { getCampaigns } from "@/app/actions/campaigns";
import { CollectClient } from "./CollectClient";
import { getProfile } from "@/app/actions/users";
import { redirect } from "next/navigation";

const ALLOWED_COLLECT_ROLES = ["collector", "admin", "chef_daara"];

export default async function CollectPage() {
  const { data: campaigns } = await getCampaigns();
  const { data: profile } = await getProfile();

  // Vérification stricte du rôle depuis le profil Django
  const isAllowed = profile?.role && ALLOWED_COLLECT_ROLES.includes(profile.role);

  if (!isAllowed) {
    redirect("/dashboard");
  }

  return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--foreground)" }}>
          Collecte de fonds physique
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
          Interface réservée aux agents collecteurs ({ALLOWED_COLLECT_ROLES.join(", ")}) pour l'enregistrement manuel des dons.
        </p>
      </div>

      <CollectClient campaigns={campaigns || []} />
    </div>
  );
}
