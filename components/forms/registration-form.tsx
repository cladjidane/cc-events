"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
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
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [state, formAction, isPending] = useActionState<RegistrationResult | null, FormData>(
    registerForEvent,
    null
  );

  useEffect(() => {
    if (state?.success) {
      toast.success(state.data?.message || "Inscription réussie !");
      formRef.current?.reset();
      setTurnstileToken("");
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state]);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="turnstileToken" value={turnstileToken} />

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

      {/* Turnstile anti-bot */}
      {siteKey && (
        <div className="flex justify-center">
          <Turnstile
            siteKey={siteKey}
            onSuccess={setTurnstileToken}
            onError={() => setTurnstileToken("")}
            onExpire={() => setTurnstileToken("")}
          />
        </div>
      )}

      {state?.success && (
        <Alert className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
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

      <Button
        type="submit"
        className="w-full"
        disabled={isPending || (!!siteKey && !turnstileToken)}
      >
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
