import { redirect } from "next/navigation";
import { getCampaigns } from "@/app/actions/campaigns";
import { getCollecteStatus } from "@/app/actions/collecte";
import { getCollectQueues } from "@/app/actions/donations";
import { getProfile } from "@/app/actions/users";
import { PageHead } from "@/components/vireo/PageHead";
import type { Role } from "@/lib/nav";
import { CollectClient, type CollectCampaign } from "./CollectClient";
import { CollectQueues, type QueueDonation } from "./CollectQueues";

const ALLOWED_COLLECT_ROLES = ["collector", "admin", "chef_daara"];

export default async function CollectPage() {
  const [{ data: campaigns }, { data: profile }, queues, { data: collecte }] =
    await Promise.all([
      getCampaigns(),
      getProfile(),
      getCollectQueues(),
      getCollecteStatus(),
    ]);
  /* Sans réponse, on ne coupe rien : le serveur refusera de toute façon. */
  const collecteActive = collecte?.active !== false;

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

      <CollectQueues
        requests={queues.requests as QueueDonation[]}
        cash={queues.cash as QueueDonation[]}
        viewerId={profile?.id}
        collecteActive={collecteActive}
      />

      <CollectClient
        campaigns={(campaigns || []) as CollectCampaign[]}
        collecteActive={collecteActive}
      />
    </div>
  );
}
