"use client";

import { useOptimistic, useTransition } from "react";
import {
  updateRegistrationStatus,
  deleteRegistration,
} from "@/actions/registrations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, Clock, X, Trash2 } from "lucide-react";
import { formatRelativeDate } from "@/lib/utils";
import { toast } from "sonner";
import type { Registration, RegistrationStatus } from "@prisma/client";

type Props = {
  registrations: Registration[];
  eventId: string;
};

const statusConfig: Record<
  RegistrationStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  CONFIRMED: { label: "Confirmé", variant: "default" },
  WAITLIST: { label: "Liste d'attente", variant: "secondary" },
  CANCELLED: { label: "Annulé", variant: "destructive" },
};

type OptimisticAction =
  | { type: "UPDATE_STATUS"; id: string; status: RegistrationStatus }
  | { type: "DELETE"; id: string };

export function RegistrationsTable({ registrations, eventId }: Props) {
  const [isPending, startTransition] = useTransition();

  const [optimisticRegistrations, addOptimisticAction] = useOptimistic(
    registrations,
    (state, action: OptimisticAction) => {
      if (action.type === "UPDATE_STATUS") {
        return state.map((r) =>
          r.id === action.id ? { ...r, status: action.status } : r
        );
      }
      if (action.type === "DELETE") {
        return state.filter((r) => r.id !== action.id);
      }
      return state;
    }
  );

  const handleStatusChange = async (id: string, status: RegistrationStatus) => {
    startTransition(async () => {
      addOptimisticAction({ type: "UPDATE_STATUS", id, status });
      const result = await updateRegistrationStatus(id, status);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Statut mis à jour");
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      addOptimisticAction({ type: "DELETE", id });
      const result = await deleteRegistration(id);
      if (!result.success) {
        toast.error(result.error);
      } else {
        toast.success("Inscription supprimée");
      }
    });
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Participant</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="w-[100px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {optimisticRegistrations.map((registration) => {
          const status = statusConfig[registration.status];
          return (
            <TableRow
              key={registration.id}
              className={registration.status === "CANCELLED" ? "opacity-50" : ""}
            >
              <TableCell>
                <div>
                  <p className="font-medium">
                    {registration.firstName} {registration.lastName}
                  </p>
                  {registration.notes && (
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {registration.notes}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>{registration.email}</TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatRelativeDate(registration.createdAt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isPending}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {registration.status !== "CONFIRMED" && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleStatusChange(registration.id, "CONFIRMED")
                        }
                      >
                        <Check className="mr-2 h-4 w-4 text-green-600" />
                        Confirmer
                      </DropdownMenuItem>
                    )}
                    {registration.status !== "WAITLIST" && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleStatusChange(registration.id, "WAITLIST")
                        }
                      >
                        <Clock className="mr-2 h-4 w-4 text-amber-600" />
                        Liste d'attente
                      </DropdownMenuItem>
                    )}
                    {registration.status !== "CANCELLED" && (
                      <DropdownMenuItem
                        onClick={() =>
                          handleStatusChange(registration.id, "CANCELLED")
                        }
                      >
                        <X className="mr-2 h-4 w-4 text-destructive" />
                        Annuler
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(registration.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
