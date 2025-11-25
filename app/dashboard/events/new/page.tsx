import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventForm } from "@/components/forms/event-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nouvel événement",
};

export default function NewEventPage() {
  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard/events"
        className="mb-6 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Retour aux événements
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Nouvel événement</CardTitle>
        </CardHeader>
        <CardContent>
          <EventForm />
        </CardContent>
      </Card>
    </div>
  );
}
