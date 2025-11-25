import { getApiKeys } from "@/actions/api-keys";
import { ApiKeyManager } from "@/components/api-key-manager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Key, Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paramètres - API Keys",
};

export default async function SettingsPage() {
  const apiKeys = await getApiKeys();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez vos clés API pour l'accès programmatique
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle>Clés API</CardTitle>
              <CardDescription>
                Utilisez ces clés pour le MCP Server ou l'API REST
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ApiKeyManager initialKeys={apiKeys} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <CardTitle>Sécurité</CardTitle>
              <CardDescription>
                Bonnes pratiques pour vos clés API
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">Ne partagez jamais vos clés.</strong>{" "}
            Chaque clé donne un accès complet à votre compte.
          </p>
          <p>
            <strong className="text-foreground">Utilisez des noms descriptifs.</strong>{" "}
            Par exemple : "MCP Server", "CI/CD", "Script backup".
          </p>
          <p>
            <strong className="text-foreground">Révoquez les clés inutilisées.</strong>{" "}
            Supprimez les clés que vous n'utilisez plus.
          </p>
          <p>
            <strong className="text-foreground">Le token n'est affiché qu'une fois.</strong>{" "}
            Copiez-le immédiatement après création.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
