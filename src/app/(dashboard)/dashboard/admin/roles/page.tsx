export default function AdminRolesPage() {
    return (
      <div className="p-8 max-w-6xl mx-auto flex flex-col gap-8 text-center py-20 opacity-60">
         <div className="w-20 h-20 bg-muted rounded-full mx-auto flex items-center justify-center mb-4">
              <span className="text-3xl font-bold">🛡️</span>
         </div>
         <h1 className="text-3xl font-bold italic">Permissions & Rôles</h1>
         <p className="text-muted-foreground">Vérification des niveaux d'accès (Admin, Chef, Collecteur, Membre).</p>
         <div className="border border-dashed p-10 rounded-2xl mt-10">En cours de déploiement...</div>
      </div>
    );
  }
