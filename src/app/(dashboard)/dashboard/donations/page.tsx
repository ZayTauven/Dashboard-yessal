import Link from "next/link";
import { Plus } from "lucide-react";
import { getDonations } from "@/app/actions/donations";
import { getProfile } from "@/app/actions/users";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PageHead } from "@/components/vireo/PageHead";
import type { Role } from "@/lib/nav";
import { DonationListClient } from "./DonationListClient";

/*
 * L'en-tête maison (titre en `text-3xl` + bouton stylé à la main) laisse place
 * à <PageHead> : même hiérarchie typographique que les vingt-sept autres
 * écrans, fil d'Ariane déduit de la navigation, actions toujours au même
 * endroit. La largeur maximale disparaît aussi — c'est désormais la coque
 * (`data-ax-width`) qui la décide, pas chaque page dans son coin.
 */
export default async function DonationsPage() {
  const [{ data: donations, error }, { data: profile }] = await Promise.all([
    getDonations(),
    getProfile(),
  ]);

  const role = (profile?.role ?? "member") as Role;

  const canNewDonation =
    role === "member" || role === "collector" || role === "chef_daara";

  const listVariant =
    role === "admin" || role === "chef_daara" ? "directory" : "personal";

  const title =
    role === "admin"
      ? "Les contributions"
      : role === "chef_daara"
        ? "Jëfs du Daara"
        : "Mes contributions";

  const subtitle =
    role === "admin"
      ? "Toutes les contributions enregistrées sur la plateforme, avec le contributeur et son Daara."
      : role === "chef_daara"
        ? "Contributions des membres rattachés à votre Daara."
        : "Historique de vos Jëfs personnels et de ceux effectués pour vos tutelles.";

  return (
    <div className="flex flex-col gap-6">
      <PageHead
        role={role}
        title={title}
        subtitle={subtitle}
        actions={
          canNewDonation && (
            <Link
              href="/dashboard/donations/new"
              className="ax-btn ax-btn--primary"
            >
              <Plus className="ax-btn__icon" size={16} aria-hidden="true" />
              <span className="ax-btn__label">Faire un Jëf</span>
            </Link>
          )
        }
      />

      {error ? (
        <ErrorAlert message={error} />
      ) : (
        <DonationListClient
          initialDonations={donations || []}
          variant={listVariant}
        />
      )}
    </div>
  );
}
