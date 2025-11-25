import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Connexion",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mb-4 inline-block text-2xl font-bold">
            EventLite
          </Link>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            Connectez-vous pour accéder au tableau de bord
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
