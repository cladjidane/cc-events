"use client";

import { useActionState, useEffect, useRef } from "react";
import { registerForEvent, type RegistrationResult } from "@/actions/register";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  eventId: string;
};

export function RegistrationForm({ eventId }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState<RegistrationResult | null, FormData>(
    registerForEvent,
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.data?.message || "Inscription réussie !");
      formRef.current?.reset();
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom *</Label>
          <Input
            id="firstName"
            name="firstName"
            required
            placeholder="Jean"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom *</Label>
          <Input
            id="lastName"
            name="lastName"
            required
            placeholder="Dupont"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="jean.dupont@email.com"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Informations complémentaires, besoins particuliers..."
          rows={3}
          disabled={isPending}
        />
      </div>

      {state?.success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{state.data?.message}</AlertDescription>
        </Alert>
      )}

      {state && !state.success && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Inscription en cours...
          </>
        ) : (
          "S'inscrire"
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        En vous inscrivant, vous acceptez de recevoir des communications
        relatives à cet événement.
      </p>
    </form>
  );
}
