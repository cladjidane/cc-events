"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent } from "@/actions/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { LocationPicker } from "@/components/map";
import type { Event } from "@prisma/client";
import type { ActionResult } from "@/lib/utils";

type Props = {
  event?: Event;
};

export function EventForm({ event }: Props) {
  const router = useRouter();
  const isEditing = !!event;

  const [mode, setMode] = useState<string>(event?.mode || "IN_PERSON");
  const [location, setLocation] = useState({
    location: event?.location || "",
    latitude: event?.latitude || undefined,
    longitude: event?.longitude || undefined,
  });

  const boundUpdateEvent = event
    ? updateEvent.bind(null, event.id)
    : async () => ({ success: false, error: "No event ID" }) as ActionResult<Event>;

  const [state, formAction, isPending] = useActionState<ActionResult<Event> | null, FormData>(
    isEditing ? boundUpdateEvent : createEvent,
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(isEditing ? "Événement mis à jour" : "Événement créé");
      router.push("/dashboard/events");
    }
  }, [state, isEditing, router]);

  // Format date for datetime-local input
  const formatDateForInput = (date: Date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Titre *</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={event?.title}
            placeholder="Conférence Tech 2025"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">Sous-titre</Label>
          <Input
            id="subtitle"
            name="subtitle"
            defaultValue={event?.subtitle || ""}
            placeholder="L'avenir du développement web"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={event?.description || ""}
            placeholder="Décrivez votre événement..."
            rows={6}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coverImage">Image de couverture (URL)</Label>
          <Input
            id="coverImage"
            name="coverImage"
            type="url"
            defaultValue={event?.coverImage || ""}
            placeholder="https://example.com/image.jpg"
            disabled={isPending}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="mode">Mode *</Label>
            <Select name="mode" defaultValue={mode} onValueChange={setMode}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IN_PERSON">Présentiel</SelectItem>
                <SelectItem value="ONLINE">En ligne</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Statut *</Label>
            <Select name="status" defaultValue={event?.status || "DRAFT"}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="PUBLISHED">Publié</SelectItem>
                <SelectItem value="CLOSED">Fermé</SelectItem>
                <SelectItem value="CANCELLED">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {mode === "IN_PERSON" ? (
          <div className="space-y-2">
            <Label>Lieu</Label>
            <LocationPicker
              value={location}
              onChange={(newLocation) => setLocation(newLocation)}
            />
            <input type="hidden" name="location" value={location.location} />
            <input type="hidden" name="latitude" value={location.latitude || ""} />
            <input type="hidden" name="longitude" value={location.longitude || ""} />
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="location">Lien de visioconférence</Label>
            <Input
              id="location"
              name="location"
              defaultValue={event?.location || ""}
              placeholder="https://zoom.us/j/..."
              disabled={isPending}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startAt">Date de début *</Label>
            <Input
              id="startAt"
              name="startAt"
              type="datetime-local"
              required
              defaultValue={event ? formatDateForInput(event.startAt) : ""}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endAt">Date de fin *</Label>
            <Input
              id="endAt"
              name="endAt"
              type="datetime-local"
              required
              defaultValue={event ? formatDateForInput(event.endAt) : ""}
              disabled={isPending}
            />
          </div>
        </div>

        <input type="hidden" name="timezone" value="Europe/Paris" />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacité (laisser vide = illimité)</Label>
            <Input
              id="capacity"
              name="capacity"
              type="number"
              min="1"
              defaultValue={event?.capacity || ""}
              placeholder="100"
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="waitlist">Liste d'attente</Label>
            <Select
              name="waitlist"
              defaultValue={event?.waitlist ? "true" : "false"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="false">Désactivée</SelectItem>
                <SelectItem value="true">Activée</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {state && !state.success && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Mise à jour..." : "Création..."}
            </>
          ) : isEditing ? (
            "Mettre à jour"
          ) : (
            "Créer l'événement"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
