"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteEvent } from "@/actions/events";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  eventId: string;
  eventTitle: string;
};

export function DeleteEventButton({ eventId, eventTitle }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleDelete = async () => {
    setIsPending(true);
    const result = await deleteEvent(eventId);

    if (result.success) {
      toast.success("Événement supprimé");
      router.push("/dashboard/events");
    } else {
      toast.error(result.error);
      setIsPending(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="mr-2 h-4 w-4" />
          Supprimer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer l'événement</DialogTitle>
          <DialogDescription>
            Êtes-vous sûr de vouloir supprimer "{eventTitle}" ? Cette action est
            irréversible et supprimera également toutes les inscriptions
            associées.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
