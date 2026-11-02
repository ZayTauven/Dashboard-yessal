/**
 * lib/pays.ts — les pays de résidence proposés au membre.
 *
 * Le champ était un texte libre, et une faute de frappe (« Senegl ») faisait
 * un pays de plus dans la répartition des Jëfs, compté dans la diaspora. On
 * enregistre désormais un code ISO 3166-1 alpha-2 ; le nom affiché vient de
 * cette table.
 *
 * ⚠ La MÊME liste vit dans `yessal-backend/core/pays.py` (qui refuse tout
 * code inconnu) et `yessal-mobile/lib/dial-codes.ts`. Ajouter un pays, c'est
 * ajouter la ligne aux trois, le serveur d'abord.
 */

export type Pays = { code: string; name: string };

/** Par région, dans l'ordre de la liste mobile : le Sénégal en tête. */
export const PAYS_PAR_REGION: { region: string; pays: Pays[] }[] = [
  {
    region: "Afrique de l'Ouest",
    pays: [
      { code: "SN", name: "Sénégal" },
      { code: "ML", name: "Mali" },
      { code: "MR", name: "Mauritanie" },
      { code: "GM", name: "Gambie" },
      { code: "GN", name: "Guinée" },
      { code: "GW", name: "Guinée-Bissau" },
      { code: "CI", name: "Côte d'Ivoire" },
      { code: "BF", name: "Burkina Faso" },
      { code: "NE", name: "Niger" },
      { code: "TG", name: "Togo" },
      { code: "BJ", name: "Bénin" },
      { code: "GH", name: "Ghana" },
      { code: "NG", name: "Nigeria" },
      { code: "SL", name: "Sierra Leone" },
      { code: "LR", name: "Liberia" },
      { code: "CV", name: "Cap-Vert" },
    ],
  },
  {
    region: "Reste de l'Afrique",
    pays: [
      { code: "MA", name: "Maroc" },
      { code: "DZ", name: "Algérie" },
      { code: "TN", name: "Tunisie" },
      { code: "LY", name: "Libye" },
      { code: "EG", name: "Égypte" },
      { code: "CM", name: "Cameroun" },
      { code: "GA", name: "Gabon" },
      { code: "CG", name: "Congo" },
      { code: "CD", name: "Congo (RDC)" },
      { code: "TD", name: "Tchad" },
      { code: "CF", name: "Centrafrique" },
      { code: "GQ", name: "Guinée équatoriale" },
      { code: "ST", name: "Sao Tomé-et-Principe" },
      { code: "AO", name: "Angola" },
      { code: "ZA", name: "Afrique du Sud" },
      { code: "KE", name: "Kenya" },
      { code: "TZ", name: "Tanzanie" },
      { code: "UG", name: "Ouganda" },
      { code: "RW", name: "Rwanda" },
      { code: "BI", name: "Burundi" },
      { code: "ET", name: "Éthiopie" },
      { code: "SO", name: "Somalie" },
      { code: "DJ", name: "Djibouti" },
      { code: "SD", name: "Soudan" },
      { code: "MZ", name: "Mozambique" },
      { code: "ZM", name: "Zambie" },
      { code: "ZW", name: "Zimbabwe" },
      { code: "MW", name: "Malawi" },
      { code: "BW", name: "Botswana" },
      { code: "NA", name: "Namibie" },
      { code: "MG", name: "Madagascar" },
      { code: "MU", name: "Maurice" },
      { code: "KM", name: "Comores" },
      { code: "SC", name: "Seychelles" },
    ],
  },
  {
    region: "Europe",
    pays: [
      { code: "FR", name: "France" },
      { code: "IT", name: "Italie" },
      { code: "ES", name: "Espagne" },
      { code: "PT", name: "Portugal" },
      { code: "BE", name: "Belgique" },
      { code: "DE", name: "Allemagne" },
      { code: "NL", name: "Pays-Bas" },
      { code: "GB", name: "Royaume-Uni" },
      { code: "IE", name: "Irlande" },
      { code: "CH", name: "Suisse" },
      { code: "AT", name: "Autriche" },
      { code: "LU", name: "Luxembourg" },
      { code: "SE", name: "Suède" },
      { code: "NO", name: "Norvège" },
      { code: "DK", name: "Danemark" },
      { code: "FI", name: "Finlande" },
      { code: "IS", name: "Islande" },
      { code: "PL", name: "Pologne" },
      { code: "CZ", name: "Tchéquie" },
      { code: "SK", name: "Slovaquie" },
      { code: "HU", name: "Hongrie" },
      { code: "RO", name: "Roumanie" },
      { code: "BG", name: "Bulgarie" },
      { code: "GR", name: "Grèce" },
      { code: "HR", name: "Croatie" },
      { code: "SI", name: "Slovénie" },
      { code: "RS", name: "Serbie" },
      { code: "AL", name: "Albanie" },
      { code: "UA", name: "Ukraine" },
      { code: "RU", name: "Russie" },
      { code: "TR", name: "Turquie" },
      { code: "CY", name: "Chypre" },
      { code: "MT", name: "Malte" },
      { code: "EE", name: "Estonie" },
      { code: "LV", name: "Lettonie" },
      { code: "LT", name: "Lituanie" },
    ],
  },
  {
    region: "Amériques",
    pays: [
      { code: "US", name: "États-Unis" },
      { code: "CA", name: "Canada" },
      { code: "MX", name: "Mexique" },
      { code: "BR", name: "Brésil" },
      { code: "AR", name: "Argentine" },
      { code: "CL", name: "Chili" },
      { code: "CO", name: "Colombie" },
      { code: "PE", name: "Pérou" },
      { code: "VE", name: "Venezuela" },
    ],
  },
  {
    region: "Moyen-Orient et Golfe",
    pays: [
      { code: "SA", name: "Arabie saoudite" },
      { code: "AE", name: "Émirats arabes unis" },
      { code: "QA", name: "Qatar" },
      { code: "KW", name: "Koweït" },
      { code: "BH", name: "Bahreïn" },
      { code: "OM", name: "Oman" },
      { code: "JO", name: "Jordanie" },
      { code: "LB", name: "Liban" },
      { code: "IL", name: "Israël" },
      { code: "IQ", name: "Irak" },
      { code: "IR", name: "Iran" },
      { code: "YE", name: "Yémen" },
    ],
  },
  {
    region: "Asie et Océanie",
    pays: [
      { code: "CN", name: "Chine" },
      { code: "HK", name: "Hong Kong" },
      { code: "JP", name: "Japon" },
      { code: "KR", name: "Corée du Sud" },
      { code: "IN", name: "Inde" },
      { code: "PK", name: "Pakistan" },
      { code: "BD", name: "Bangladesh" },
      { code: "ID", name: "Indonésie" },
      { code: "MY", name: "Malaisie" },
      { code: "SG", name: "Singapour" },
      { code: "TH", name: "Thaïlande" },
      { code: "VN", name: "Viêt Nam" },
      { code: "PH", name: "Philippines" },
      { code: "AU", name: "Australie" },
      { code: "NZ", name: "Nouvelle-Zélande" },
    ],
  },
];

const NOMS = new Map(
  PAYS_PAR_REGION.flatMap(({ pays }) => pays.map((p) => [p.code, p.name] as const)),
);

/** « SN » → « Sénégal ». Une valeur inconnue est rendue telle quelle. */
export function nomPays(code?: string | null): string | null {
  if (!code) return null;
  return NOMS.get(code) ?? code;
}
