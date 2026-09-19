/*
 * Le registre des chapitres.
 *
 * Le manifeste (`lib/guide/manifest.ts`) dit ce qui EXISTE ; ce fichier dit
 * comment chacun se rend. La route `/guide/[slug]` croise les deux, et un
 * chapitre annoncé au sommaire sans corps ici rend un 404 franc plutôt qu'une
 * page vide — l'erreur se voit tout de suite, en développement.
 */

import type { ComponentType } from "react";

import Bienvenue from "./bienvenue";
import PremiersPas from "./premiers-pas";
import Reperes from "./reperes";
import Lexique from "./lexique";
import Roles from "./roles";
import FaireUnJef from "./faire-un-jef";
import CollectePhysique from "./collecte-physique";
import LancerUnNdiguel from "./lancer-un-ndiguel";
import SuivreSonDaara from "./suivre-son-daara";
import Tutelles from "./tutelles";
import ProfilDocuments from "./profil-documents";
import Mobile from "./mobile";
import Securite from "./securite";

export const CHAPTER_BODIES: Record<string, ComponentType> = {
  bienvenue: Bienvenue,
  "premiers-pas": PremiersPas,
  reperes: Reperes,
  lexique: Lexique,
  roles: Roles,
  "faire-un-jef": FaireUnJef,
  "collecte-physique": CollectePhysique,
  "lancer-un-ndiguel": LancerUnNdiguel,
  "suivre-son-daara": SuivreSonDaara,
  tutelles: Tutelles,
  "profil-documents": ProfilDocuments,
  mobile: Mobile,
  securite: Securite,
};
