import { getAllUsers } from "@/app/actions/users";
import { getDaaras } from "@/app/actions/daara";
import { UserManagementClient } from "./UserManagementClient";

export default async function AdminUsersPage() {
  const [{ data: users, error: userError }, { data: daaras, error: daaraError }] = await Promise.all([
    getAllUsers(),
    getDaaras()
  ]);

  const error = userError || daaraError;

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utilisateurs et rôles</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Pilotez l&apos;ensemble des accès à la plateforme Yessal Gui, y compris les comptes administrateurs. Créez des profils, modifiez les rôles et validez les inscriptions.
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 font-medium">
          {error} - Veuillez rafraîchir la page ou vérifier votre connexion.
        </div>
      ) : (
        <UserManagementClient initialUsers={users || []} daaras={daaras || []} />
      )}
    </div>
  );
}
