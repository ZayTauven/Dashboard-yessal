import { PAYS_PAR_REGION } from "@/lib/pays";

/**
 * Le pays de résidence, choisi dans une liste : la valeur envoyée est un code
 * ISO (« SN »), jamais un nom tapé. Le serveur refuse ce qu'il ne connaît pas.
 * Les régions regroupent les 122 pays ; la saisie des premières lettres, au
 * clavier, saute au pays dans le menu natif.
 */
export function PaysSelect({
  id,
  defaultValue,
  required,
  placeholder,
}: {
  id: string;
  defaultValue?: string | null;
  required?: boolean;
  placeholder: string;
}) {
  return (
    <select
      id={id}
      name={id}
      className="ax-select"
      defaultValue={defaultValue ?? ""}
      required={required}
    >
      <option value="">{placeholder}</option>
      {PAYS_PAR_REGION.map(({ region, pays }) => (
        <optgroup key={region} label={region}>
          {pays.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
