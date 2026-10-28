"use client";

/*
 * Les deux gestes de l'administration sur les éditions d'une série :
 *
 *   · « Préparer la prochaine édition » — sans attendre le planificateur,
 *     pour une série sans génération automatique ou pour retoucher à
 *     l'avance le propos et la photo de la semaine suivante ;
 *   · « Confirmer la date » — une édition hégirienne (Magal) est créée à une
 *     date ESTIMÉE et reste invisible aux membres jusqu'à ce que
 *     l'administration la confirme ou la corrige selon l'annonce.
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { confirmEditionDate, prepareNextEdition } from "@/app/actions/events";
import { DatePicker } from "@/components/ui/DatePicker";
import { Modal } from "@/components/vireo/Modal";

export function PrepareEditionButton({ feteId }: { feteId: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const prepare = () =>
    startTransition(async () => {
      const res = await prepareNextEdition(feteId);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(
        res.data?.creee
          ? `Édition préparée : ${res.data.name}.`
          : `${res.data?.name} existe déjà.`,
      );
      router.refresh();
    });

  return (
    <button
      type="button"
      className="ax-btn ax-btn--tonal ax-btn--sm"
      onClick={prepare}
      disabled={isPending}
    >
      <CalendarPlus className="ax-btn__icon" size={14} aria-hidden="true" />
      <span className="ax-btn__label">Préparer la prochaine édition</span>
    </button>
  );
}

export function ConfirmDateButton({
  campaignId,
  feteId,
  estimee,
}: {
  campaignId: number;
  feteId: number;
  estimee: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = (formData: FormData) =>
    startTransition(async () => {
      const date = String(formData.get("date") || "");
      if (!date) {
        toast.error("Choisissez la date annoncée.");
        return;
      }
      const res = await confirmEditionDate(campaignId, feteId, date);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Date confirmée : ${res.data?.name}. Les membres la voient désormais.`);
      setOpen(false);
      router.refresh();
    });

  return (
    <>
      <button
        type="button"
        className="ax-btn ax-btn--primary ax-btn--sm self-start"
        onClick={() => setOpen(true)}
      >
        <CalendarCheck className="ax-btn__icon" size={14} aria-hidden="true" />
        <span className="ax-btn__label">Confirmer la date</span>
      </button>

      {open && (
        <Modal
          open
          onOpenChange={(o) => !o && setOpen(false)}
          title="Confirmer la date de l'édition"
          description="Date estimée selon le calendrier hégirien. Corrigez-la si l'annonce officielle diffère : elle ne sera visible des membres qu'après confirmation."
          size="sm"
        >
          <form action={submit} className="flex flex-col gap-4">
            <div className="ax-field">
              <span className="ax-field__label">Date annoncée</span>
              <DatePicker name="date" defaultValue={estimee} required />
            </div>
            <button type="submit" className="ax-btn ax-btn--primary" disabled={isPending}>
              <span className="ax-btn__label">Confirmer et publier</span>
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
