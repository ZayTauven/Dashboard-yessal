/**
 * Les formes que la messagerie reçoit de `comms/` — une seule source pour la
 * liste, le fil, le composeur et le panneau d'informations.
 */

export type LastMessage = {
  content: string;
  sent_at: string | null;
  sender_name: string;
  sender_id?: number | null;
  message_type?: MessageType;
  is_mine?: boolean;
};

export type MessageType = "text" | "file" | "system" | "card";

export type ChatRow = {
  id: number;
  chat_type: "direct" | "group" | "channel";
  display_name: string;
  avatar?: string | null;
  last_message?: LastMessage | null;
  unread_count?: number;
  members_count?: number;
  is_muted?: boolean;
  /** L'interlocuteur d'un tête-à-tête. */
  peer_id?: number | null;
  /** Jusqu'où l'interlocuteur a lu — le « Vu ». Tête-à-tête seulement. */
  peer_last_read_at?: string | null;
  last_activity_at?: string | null;
  daara?: number | null;
  campaign?: number | null;
  created_by?: number | null;
  /** Canaux du Kourel : « guide » (annonces de Sangue Bi) ou « jefs ». */
  channel_kind?: "guide" | "jefs" | null;
  description?: string;
  /** Faux dans un canal pour qui n'en est pas auteur, et partout dans un fil archivé. */
  can_post?: boolean;
  /** Salon : ajouter, retirer, nommer un modérateur — `services.peut_moderer`. */
  can_moderate?: boolean;
  /** À qui s'adresse le fil — `comms/audience.py`. `null` : tout le Kourel (canal) ou composé à la main (salon). */
  audience?: Audience | null;
  push_enabled?: boolean;
  /** « Les Jëfs du Kourel » : montants affichés (avec le consentement du donateur). */
  show_amounts?: boolean;
  /** Clé d'icône (liste fermée côté serveur), vide : l'icône par défaut. */
  icon?: string;
  archived_at?: string | null;
  pinned_message?: PinnedMessage | null;
  /** Canal fondateur (Sangue Bi, Jëfs) : ni ciblé, ni archivé. */
  is_system?: boolean;
};

/** Les catégories se combinent en ET, les valeurs d'une catégorie en OU. */
export type Audience = { titles?: number[]; ldds?: number[]; daaras?: number[]; roles?: string[] };

export type PinnedMessage = { id: number; preview: string; sender_name: string; sent_at: string };

export type Reaction = { emoji: string; count: number; reacted_by_me: boolean };

export type ReplyPreview = {
  id: number;
  sender_name: string;
  content: string;
  message_type: MessageType;
  is_deleted: boolean;
};

/** La carte qu'un Jëf confirmé pose dans « Les Jëfs du Kourel ». */
export type JefCard = {
  kind: "jef";
  donation_id: number;
  campaign_id: number;
  campaign_name: string;
  donor: { id: number; name: string; title?: string | null; avatar?: string | null } | null;
  variant: "palier" | "diaspora" | "photo" | "picto";
  picto?: string;
  tone?: "peach" | "yellow" | "teal" | "pink" | "lilac";
  photo_url?: string;
  milestone?: number;
  /** Présent seulement si le donateur a consenti ET que le canal affiche les montants. */
  amount?: number;
};

export type MessageRow = {
  id: number;
  chat: number;
  sender: { id: number; name: string; avatar?: string | null; role?: string | null; title?: string | null };
  message_type: MessageType;
  content: string;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  file_is_image?: boolean;
  file_kind?: "image" | "audio" | "video" | "document" | null;
  edited_at?: string | null;
  payload?: JefCard | null;
  reply_to?: number | null;
  reply_preview?: ReplyPreview | null;
  reactions?: Reaction[];
  is_deleted: boolean;
  sent_at: string;
  /**
   * État local d'un message pas encore confirmé par le serveur. Absent sur
   * tout ce qui vient de l'API ou de Pusher.
   */
  local?: { status: "sending" | "failed"; file?: File | null; previewUrl?: string | null; clientId?: string };
  /** Renvoyé par l'événement Pusher : l'identifiant de la bulle optimiste d'origine. */
  client_id?: string | null;
};

export type ChatMember = {
  id: number;
  name: string;
  avatar?: string | null;
  daara_name?: string | null;
  role?: string | null;
  title?: string | null;
  /** Dans un salon : modérateur (le créateur d'office). */
  is_moderator?: boolean;
  /** Entré par son titre : la synchronisation le gère, on ne le retire pas à la main. */
  par_audience?: boolean;
};

export type ChatInvitationRow = {
  id: number;
  sender: { id: number; name: string; avatar?: string | null };
  recipient: { id: number; name: string; avatar?: string | null };
  chat?: number | null;
  chat_name?: string | null;
  status: "pending" | "accepted" | "declined" | "expired";
  created_at: string;
};

export type DaaraOption = { id: number; name?: string };

/** Un membre remonté par la recherche d'annuaire. */
export type DirectorySearchUser = {
  id: number;
  name: string;
  role?: string | null;
  avatar?: string | null;
  daara_name?: string | null;
};

export type MessagingPreferences = {
  visibility?: string;
  [key: string]: string | number | boolean | null | undefined;
};

export type PilotageConfig = {
  daara_name?: string | null;
  allow_member_visibility_setting?: boolean;
  allow_file_sharing?: boolean;
  [key: string]: string | number | boolean | null | undefined;
};

export type PresenceMember = { name: string; avatar?: string | null; hidden?: boolean };

/** Ce que `chat-updated` porte sur le canal personnel. */
export type ChatUpdatedEvent = {
  chat_id: number;
  message_id: number;
  last_message: LastMessage;
};
