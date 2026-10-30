/**
 * L'icône d'un fil. Les canaux en reçoivent une, choisie par l'administration
 * dans une liste FERMÉE — la même côté serveur (`comms/audience.ICONES`) et
 * côté mobile (`components/chat/ChannelIcon.tsx`).
 */
import {
  BellRing,
  BookOpen,
  CalendarDays,
  GraduationCap,
  HandHeart,
  Hash,
  Heart,
  Landmark,
  Megaphone,
  Moon,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ChatRow } from "./types";

export const CHANNEL_ICONS: Record<string, { icon: LucideIcon; label: string }> = {
  megaphone: { icon: Megaphone, label: "Annonce" },
  "hand-heart": { icon: HandHeart, label: "Jëf" },
  "book-open": { icon: BookOpen, label: "Enseignement" },
  calendar: { icon: CalendarDays, label: "Programme" },
  users: { icon: Users, label: "Communauté" },
  star: { icon: Star, label: "Distinction" },
  bell: { icon: BellRing, label: "Rappel" },
  heart: { icon: Heart, label: "Solidarité" },
  "graduation-cap": { icon: GraduationCap, label: "Daara" },
  sparkles: { icon: Sparkles, label: "Fête" },
  moon: { icon: Moon, label: "Veillée" },
  landmark: { icon: Landmark, label: "Ndiguel" },
};

/** L'icône d'un fil : celle que l'admin a choisie, sinon celle de son type. */
export function chatIcon(chat: Pick<ChatRow, "chat_type" | "channel_kind" | "icon">): LucideIcon {
  if (chat.icon && CHANNEL_ICONS[chat.icon]) return CHANNEL_ICONS[chat.icon].icon;
  if (chat.channel_kind === "jefs") return HandHeart;
  if (chat.chat_type === "channel") return Megaphone;
  return Hash;
}
