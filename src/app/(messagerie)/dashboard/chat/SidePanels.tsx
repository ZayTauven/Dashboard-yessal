"use client";

/**
 * Les volets secondaires de la messagerie : trouver un membre, répondre aux
 * demandes, piloter les échanges, régler sa confidentialité.
 *
 * Repris de l'ancien `ChatInterface`, avec un changement de fond dans la
 * recherche : un résultat SAIT désormais s'il existe déjà une conversation
 * (« Ouvrir ») ou une demande en attente (« Demande envoyée »). Avant, le
 * bouton « Inviter » répondait par une erreur du serveur dans les deux cas.
 */
import { Clock, MessageCircle, Search, Settings, Shield, UserCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { initials, roleLabel } from "./format";
import type {
  ChatInvitationRow,
  ChatRow,
  DirectorySearchUser,
  MessagingPreferences,
  PilotageConfig,
} from "./types";

function PanelHead({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="space-y-1 border-b px-4 pt-4 pb-3">
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--ax-accent)" }}>{icon}</span>
        <h2 className="text-base font-bold">{title}</h2>
      </div>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function PersonAvatar({ name, avatar, size = "h-9 w-9" }: { name: string; avatar?: string | null; size?: string }) {
  return (
    <Avatar className={`${size} shrink-0`}>
      {avatar ? <AvatarImage src={avatar} alt="" /> : null}
      <AvatarFallback className="text-xs font-bold text-white" style={{ background: "var(--ax-accent)" }}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function SearchPanel({
  term,
  results,
  chats,
  invitations,
  currentUserId,
  onSearch,
  onInvite,
  onOpenChat,
}: {
  term: string;
  results: DirectorySearchUser[];
  chats: ChatRow[];
  invitations: ChatInvitationRow[];
  currentUserId: number;
  onSearch: (q: string) => void;
  onInvite: (userId: number) => void;
  onOpenChat: (chat: ChatRow) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHead icon={<Search size={18} />} title="Écrire à un membre" hint="Une demande part ; la discussion s'ouvre quand elle est acceptée." />
      <div className="px-4 pt-3">
        <div className="ax-field__control">
          <span className="ax-field__affix ax-field__affix--leading">
            <Search aria-hidden="true" />
          </span>
          <input
            type="search"
            autoFocus
            className="ax-input ax-input--sm ax-input--with-leading-icon"
            placeholder="Nom, téléphone, e-mail…"
            aria-label="Rechercher un membre"
            value={term}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <ul className="space-y-1.5 p-3">
          {results.map((u) => {
            const existing = chats.find((c) => c.chat_type === "direct" && c.peer_id === u.id);
            const pending = invitations.some(
              (i) => i.status === "pending" && i.sender.id === currentUserId && i.recipient.id === u.id,
            );
            return (
              <li key={u.id} className="flex items-center justify-between gap-3 rounded-xl border p-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <PersonAvatar name={u.name} avatar={u.avatar} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{u.name}</div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {[roleLabel(u.role), u.daara_name].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
                {existing ? (
                  <button type="button" className="ax-btn ax-btn--outline ax-btn--sm shrink-0" onClick={() => onOpenChat(existing)}>
                    <MessageCircle size={14} aria-hidden />
                    <span className="ax-btn__label">Ouvrir</span>
                  </button>
                ) : pending ? (
                  <span className="shrink-0 text-[11px] font-medium text-muted-foreground inline-flex items-center gap-1">
                    <Clock size={12} aria-hidden /> Demande envoyée
                  </span>
                ) : (
                  <button type="button" className="ax-btn ax-btn--primary ax-btn--sm shrink-0" onClick={() => onInvite(u.id)}>
                    <span className="ax-btn__label">Écrire</span>
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {term.trim().length >= 2 && results.length === 0 && (
          <p className="mt-6 px-6 text-center text-sm text-muted-foreground">
            Personne ne correspond. Certains membres ne se rendent visibles qu&apos;à leur Daara.
          </p>
        )}
        {term.trim().length < 2 && (
          <p className="mt-6 px-6 text-center text-xs text-muted-foreground">Tapez au moins deux lettres.</p>
        )}
      </div>
    </div>
  );
}

export function InvitesPanel({
  invitations,
  onRespond,
}: {
  invitations: ChatInvitationRow[];
  onRespond: (id: number, accept: boolean) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHead icon={<UserCheck size={18} />} title="Demandes" hint="Des membres souhaitent vous écrire." />
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <ul className="space-y-2.5 p-3">
          {invitations.map((invite) => (
            <li key={invite.id} className="space-y-3 rounded-xl border p-3">
              <div className="flex items-center gap-3">
                <PersonAvatar name={invite.sender.name} avatar={invite.sender.avatar} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{invite.sender.name}</div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock size={11} aria-hidden />
                    {new Date(invite.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" className="ax-btn ax-btn--primary ax-btn--sm flex-1" onClick={() => onRespond(invite.id, true)}>
                  <span className="ax-btn__label">Accepter</span>
                </button>
                <button type="button" className="ax-btn ax-btn--outline ax-btn--sm flex-1" onClick={() => onRespond(invite.id, false)}>
                  <span className="ax-btn__label">Décliner</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
        {invitations.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Aucune demande en attente.</p>
        )}
      </div>
    </div>
  );
}

const PILOTAGE_KEYS = [
  { key: "allow_cross_daara_search", label: "Recherche inter-Daara", desc: "Trouver des membres d'autres Daaras." },
  { key: "allow_member_invite", label: "Demandes directes", desc: "Les membres peuvent s'écrire en privé." },
  { key: "allow_group_creation", label: "Création de salons", desc: "Les membres peuvent ouvrir des salons." },
  { key: "allow_file_sharing", label: "Pièces jointes", desc: "Envoi de documents et d'images." },
  { key: "allow_member_visibility_setting", label: "Réglage de visibilité", desc: "Chacun règle qui peut le trouver." },
];

export function PilotagePanel({
  pilotage,
  onChange,
}: {
  pilotage: PilotageConfig;
  onChange: (key: string, value: boolean) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHead
        icon={<Shield size={18} />}
        title="Pilotage"
        hint={`Règles des échanges pour ${pilotage.daara_name || "toute la plateforme"}.`}
      />
      <div className="space-y-2 overflow-y-auto p-3">
        {PILOTAGE_KEYS.map(({ key, label, desc }) => (
          <label key={key} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-muted/40 p-3 hover:bg-muted/60">
            <span>
              <span className="block text-xs font-semibold">{label}</span>
              <span className="block text-[11px] text-muted-foreground">{desc}</span>
            </span>
            <Checkbox checked={Boolean(pilotage[key])} onCheckedChange={(c) => onChange(key, !!c)} />
          </label>
        ))}
      </div>
    </div>
  );
}

const PREF_KEYS = [
  { key: "notifications_enabled", label: "Notifications", desc: "Être prévenu des nouveaux messages sur le téléphone." },
  { key: "notify_on_mention_only", label: "Seulement si on me cite", desc: "Ne sonner que pour une réponse ou une @mention." },
  { key: "show_online_status", label: "Présence visible", desc: "Les autres voient quand vous êtes dans la conversation." },
  { key: "allow_direct_invites", label: "Demandes directes", desc: "Accepter qu'on vous propose une discussion." },
  { key: "allow_group_invites", label: "Invitations aux salons", desc: "Accepter d'être invité dans un salon." },
];

export function SettingsPanel({
  preferences,
  pilotage,
  onChange,
}: {
  preferences: MessagingPreferences;
  pilotage: PilotageConfig | null;
  onChange: (key: string, value: string | boolean) => void;
}) {
  const locked = Boolean(pilotage) && !pilotage?.allow_member_visibility_setting;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHead icon={<Settings size={18} />} title="Réglages" hint="Confidentialité et notifications." />
      <div className="space-y-2 overflow-y-auto p-3">
        <div className="space-y-1.5 rounded-xl bg-muted/40 p-3">
          <label htmlFor="pref-visibility" className="block text-xs font-semibold">
            Qui peut me trouver ?
          </label>
          <select
            id="pref-visibility"
            className="ax-select ax-select--sm"
            value={preferences.visibility}
            onChange={(e) => onChange("visibility", e.target.value)}
            disabled={locked}
          >
            <option value="all">Tout le monde</option>
            <option value="daara_only">Mon Daara uniquement</option>
            <option value="nobody">Personne</option>
          </select>
          {locked && <p className="text-[11px] italic text-muted-foreground">Verrouillé par l&apos;administrateur.</p>}
        </div>
        {PREF_KEYS.map(({ key, label, desc }) => (
          <label key={key} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-muted/40 p-3 hover:bg-muted/60">
            <span>
              <span className="block text-xs font-semibold">{label}</span>
              <span className="block text-[11px] text-muted-foreground">{desc}</span>
            </span>
            <Checkbox checked={Boolean(preferences[key])} onCheckedChange={(c) => onChange(key, !!c)} />
          </label>
        ))}
      </div>
    </div>
  );
}
