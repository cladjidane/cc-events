"use client";

import { useState } from "react";
import { createApiKey, deleteApiKey } from "@/actions/api-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Copy,
  Check,
  Key,
  Loader2,
  AlertTriangle,
} from "lucide-react";

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
};

type Props = {
  initialKeys: ApiKey[];
};

export function ApiKeyManager({ initialKeys }: Props) {
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;

    setIsCreating(true);
    setError(null);

    const result = await createApiKey(newKeyName.trim());

    if (result.success && result.data) {
      const { token, prefix } = result.data;
      setNewToken(token);
      setKeys((prev) => [
        {
          id: crypto.randomUUID(), // Temp ID, will be replaced on refresh
          name: newKeyName.trim(),
          prefix,
          lastUsedAt: null,
          expiresAt: null,
          createdAt: new Date(),
        },
        ...prev,
      ]);
      setNewKeyName("");
    } else if (!result.success) {
      setError(result.error);
    }

    setIsCreating(false);
  };

  const handleDelete = async (keyId: string) => {
    setDeletingId(keyId);

    const result = await deleteApiKey(keyId);

    if (result.success) {
      setKeys((prev) => prev.filter((k) => k.id !== keyId));
    } else {
      setError(result.error || "Erreur lors de la suppression");
    }

    setDeletingId(null);
  };

  const handleCopy = async () => {
    if (!newToken) return;

    await navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Jamais";
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Formulaire de création */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Label htmlFor="keyName" className="sr-only">
            Nom de la clé
          </Label>
          <Input
            id="keyName"
            placeholder="Nom de la clé (ex: MCP Server)"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </div>
        <Button onClick={handleCreate} disabled={isCreating || !newKeyName.trim()}>
          {isCreating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Créer
            </>
          )}
        </Button>
      </div>

      {/* Affichage du nouveau token */}
      {newToken && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <AlertTriangle className="h-4 w-4 text-green-600" />
          <AlertDescription className="space-y-3">
            <p className="font-medium text-green-800 dark:text-green-200">
              Copiez votre clé maintenant ! Elle ne sera plus affichée.
            </p>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 bg-white dark:bg-black rounded border font-mono text-sm break-all">
                {newToken}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNewToken(null)}
              className="mt-2"
            >
              J'ai copié, fermer
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Liste des clés */}
      <div className="space-y-3">
        {keys.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune clé API</p>
            <p className="text-sm">Créez une clé pour utiliser l'API</p>
          </div>
        ) : (
          keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{key.name}</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {key.prefix}...
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Créée le {formatDate(key.createdAt)}
                  {key.lastUsedAt && (
                    <span> • Dernière utilisation : {formatDate(key.lastUsedAt)}</span>
                  )}
                </div>
              </div>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    {deletingId === key.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Supprimer cette clé ?</AlertDialogTitle>
                    <AlertDialogDescription>
                      La clé "{key.name}" ({key.prefix}...) sera révoquée immédiatement.
                      Toute application utilisant cette clé perdra l'accès à l'API.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(key.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Supprimer
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="pt-4 border-t text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">Utilisation :</p>
        <div className="bg-muted p-3 rounded-lg font-mono text-xs overflow-x-auto">
          <code>Authorization: Bearer evl_xxxxxxxxxxxxx</code>
        </div>
      </div>
    </div>
  );
}
