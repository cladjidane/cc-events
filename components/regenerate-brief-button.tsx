"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface RegenerateBriefButtonProps {
  eventId: string;
}

export function RegenerateBriefButton({ eventId }: RegenerateBriefButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegenerate = async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/v1/events/${eventId}/generate-brief`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la génération");
      }

      const data = await response.json();
      const brief = encodeURIComponent(data.data.brief);

      // Rediriger vers la page IA avec le brief pré-rempli
      router.push(`/dashboard/events/new-ai?brief=${brief}&editId=${eventId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erreur lors de la génération"
      );
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRegenerate}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-2 h-4 w-4" />
      )}
      Modifier avec l'IA
    </Button>
  );
}
