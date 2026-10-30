import { redirect } from "next/navigation";

/*
 * Les notifications d'un Jëf (« Jëf encaissé », « Jëf confirmé »…) portent le
 * lien `/dashboard/donations/<id>` : sur mobile, il ouvre le reçu. Le web n'a
 * pas encore d'écran par Jëf ; un clic sur la notification depuis un
 * ordinateur mène donc à la liste des Jëfs plutôt qu'à une page introuvable.
 */
export default function DonationRedirect() {
  redirect("/dashboard/donations");
}
