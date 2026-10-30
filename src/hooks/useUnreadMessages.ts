"use client";

/**
 * Le nombre de messages non lus, pour la pastille « Messagerie » du menu.
 *
 * Jusqu'ici, rien hors de l'écran de messagerie ne disait qu'un message
 * attendait : un coordinateur passait sa journée sur les Ndiguels sans savoir
 * qu'on lui avait écrit. La pastille suit le serveur (`comms/unread/`, sans
 * les fils en sourdine) et se met à jour en direct :
 *
 *   private-user.{moi}   chat-updated (salons, directs) · chat-read (lu ailleurs)
 *   private-kourel       chat-updated (canaux du Kourel)
 *
 * Plutôt que d'additionner des +1 — qui ne sauraient pas qu'un fil est en
 * sourdine — chaque événement redemande le total, regroupé sur 300 ms :
 * une rafale de messages ne déclenche qu'un appel.
 */
import { useEffect, useRef, useState } from "react";
import Pusher from "pusher-js";
import { getPusherAuthSignature, getUnreadSummary } from "@/app/actions/comms";

const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || "bea7b0eb7536983d2be8";
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "eu";
const REGROUPEMENT_MS = 300;

export function useUnreadMessages(userId?: number | null) {
  const [total, setTotal] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    const refresh = async () => {
      const res = await getUnreadSummary();
      if (active && typeof res.total === "number") setTotal(res.total);
    };
    const soon = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(refresh, REGROUPEMENT_MS);
    };

    void refresh();

    const pusher = new Pusher(PUSHER_KEY, {
      cluster: PUSHER_CLUSTER,
      channelAuthorization: {
        customHandler: async ({ channelName, socketId }, callback) => {
          try {
            const res = (await getPusherAuthSignature(channelName, socketId)) as { auth?: string; channel_data?: string };
            if (typeof res.auth === "string") callback(null, { auth: res.auth, channel_data: res.channel_data });
            else callback(new Error("Pusher auth failed"), null);
          } catch (e) {
            callback(e as Error, null);
          }
        },
      },
    });
    const mine = pusher.subscribe(`private-user.${userId}`);
    mine.bind("chat-updated", soon);
    mine.bind("chat-read", soon);
    pusher.subscribe("private-kourel").bind("chat-updated", soon);
    /* Après une coupure réseau, des événements ont pu se perdre. */
    let dejaConnecte = false;
    pusher.connection.bind("connected", () => {
      if (dejaConnecte) soon();
      dejaConnecte = true;
    });

    const onVisible = () => document.visibilityState === "visible" && soon();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      if (timer.current) clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
      pusher.disconnect();
    };
  }, [userId]);

  return total;
}
