import Link from "next/link";
import { getEventsForDashboard } from "@/actions/events";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MoreHorizontal, Eye, Pencil, Users, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Événements",
};

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  PUBLISHED: { label: "Publié", variant: "default" },
  CLOSED: { label: "Fermé", variant: "outline" },
  CANCELLED: { label: "Annulé", variant: "destructive" },
};

export default async function EventsPage() {
  const events = await getEventsForDashboard();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Événements</h1>
          <p className="text-muted-foreground">
            Gérez vos événements et inscriptions
          </p>
        </div>
        <Link href="/dashboard/events/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel événement
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <h3 className="mb-2 text-lg font-medium">Aucun événement</h3>
          <p className="mb-4 text-muted-foreground">
            Créez votre premier événement pour commencer.
          </p>
          <Link href="/dashboard/events/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Créer un événement
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titre</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-center">Inscrits</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => {
                const status = statusLabels[event.status];
                return (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div>
                        <Link
                          href={`/dashboard/events/${event.id}`}
                          className="font-medium hover:underline"
                        >
                          {event.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {event.mode === "ONLINE" ? "En ligne" : "Présentiel"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(event.startAt)}</TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {event._count.registrations}
                      {event.capacity && `/${event.capacity}`}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/events/${event.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              Voir
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/events/${event.id}?edit=true`}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Modifier
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/events/${event.id}/registrations`}>
                              <Users className="mr-2 h-4 w-4" />
                              Inscriptions
                            </Link>
                          </DropdownMenuItem>
                          {event.status === "PUBLISHED" && (
                            <DropdownMenuItem asChild>
                              <Link href={`/e/${event.slug}`} target="_blank">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Page publique
                              </Link>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
