import { redirect } from "next/navigation";
import { getCampaigns } from "@/app/actions/campaigns";
import { getProfile } from "@/app/actions/users";
import { PageHead } from "@/components/vireo/PageHead";
import type { Role } from "@/lib/nav";
import { CollectClient, type CollectCampaign } from "./CollectClient";

const ALLOWED_COLLECT_ROLES = ["collector", "admin", "chef_daara"];

export default async function CollectPage() {
  const [{ data: campaigns }, { data: profile }] = await Promise.all([
    getCampaigns(),
    getProfile(),
  ]);

  // Vérification stricte du rôle depuis le profil Django.
  const role = (profile?.role ?? "member") as Role;
  if (!ALLOWED_COLLECT_ROLES.includes(role)) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      {/*
        L'ancien sous-titre listait les rôles autorisés en clair
        (« collector, admin, chef_daara ») : un détail d'implémentation affiché
        à quelqu'un qui, par construction, fait déjà partie de la liste.
      */}
      <PageHead
        role={role}
        title="Collecte physique"
        subtitle="Enregistrez un versement en espèces reçu de la main à la main."
      />

      <CollectClient campaigns={(campaigns || []) as CollectCampaign[]} />
    </div>
  );
}
