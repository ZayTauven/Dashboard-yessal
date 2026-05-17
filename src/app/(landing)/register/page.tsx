import RegisterClient from "./RegisterClient";
import { getDaaras } from "@/app/actions/daara";

type DaaraOption = {
  id: number;
  name: string;
  ldd?: {
    code: string;
    name: string;
  };
};

function normalizeDaaras(raw: unknown): DaaraOption[] {
  if (Array.isArray(raw)) return raw as DaaraOption[];
  if (raw && typeof raw === "object" && "results" in raw) {
    return ((raw as { results?: DaaraOption[] }).results ??
      []) as DaaraOption[];
  }
  return [];
}

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const { data, error } = await getDaaras();
  const daaras = normalizeDaaras(data).filter(
    (daara) => typeof daara?.id === "number",
  );

  return <RegisterClient daaras={error ? [] : daaras} />;
}
