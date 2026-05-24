import { redirect } from "next/navigation";
import { getDaaraById, getDaaraEtat } from "@/app/actions/daara";
import { AdminDaaraDetailView } from "./AdminDaaraDetailView";

export default async function AdminDaaraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pk = parseInt(id, 10);
  if (Number.isNaN(pk)) redirect("/dashboard/admin/daara");

  const [{ data: daara, error }, { data: etat }] = await Promise.all([
    getDaaraById(pk),
    getDaaraEtat(pk),
  ]);

  if (error || !daara) redirect("/dashboard/admin/daara");

  return <AdminDaaraDetailView daara={daara} etat={etat ?? null} />;
}
