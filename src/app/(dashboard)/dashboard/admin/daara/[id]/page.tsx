import { redirect } from "next/navigation";
import { getDaaraById } from "@/app/actions/daara";
import { DaaraEditClient } from "./DaaraEditClient";

export default async function AdminDaaraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pk = parseInt(id, 10);
  if (Number.isNaN(pk)) {
    redirect("/dashboard/admin/daara");
  }

  const { data, error } = await getDaaraById(pk);
  if (error || !data) {
    redirect("/dashboard/admin/daara");
  }

  return <DaaraEditClient daara={data} />;
}
