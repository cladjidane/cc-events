import Groq from "groq-sdk";

// Lazy initialization pour éviter les erreurs au build
let groq: Groq | null = null;

function getGroqClient(): Groq {
  if (!groq) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groq;
}

export interface ParsedEvent {
  title: string;
  subtitle?: string;
  description?: string;
  mode: "IN_PERSON" | "ONLINE";
  location?: string;
  startAt: string;
  endAt?: string;
  capacity?: number;
}

const SYSTEM_PROMPT = `Tu es un assistant qui parse des briefs d'événements en JSON structuré.

Règles :
- Extrais les informations du brief utilisateur
- Génère un titre accrocheur si non explicite
- Déduis le mode (IN_PERSON si lieu physique mentionné, ONLINE si visio/lien/remote)
- Les dates doivent être au format ISO 8601 avec timezone Europe/Paris
- Si l'heure de fin n'est pas mentionnée, ne pas inclure endAt
- Si la capacité n'est pas mentionnée, ne pas inclure capacity
- Réponds UNIQUEMENT avec le JSON, sans markdown, sans explication

Format de sortie :
{
  "title": "string (requis)",
  "subtitle": "string (optionnel)",
  "description": "string (optionnel, développe le brief)",
  "mode": "IN_PERSON | ONLINE (requis)",
  "location": "string (optionnel)",
  "startAt": "ISO 8601 avec timezone (requis)",
  "endAt": "ISO 8601 avec timezone (optionnel)",
  "capacity": "number (optionnel)"
}`;

export async function parseEventBrief(
  brief: string,
  referenceDate?: Date
): Promise<ParsedEvent> {
  const today = referenceDate || new Date();
  const dateContext = `Date de référence pour les dates relatives : ${today.toISOString().split("T")[0]}`;

  const response = await getGroqClient().chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `${dateContext}\n\nBrief : ${brief}` },
    ],
    temperature: 0.1,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Pas de réponse du modèle");
  }

  // Nettoyer la réponse (enlever markdown si présent)
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```$/g, "");
  }

  const parsed = JSON.parse(jsonStr) as ParsedEvent;

  // Validation minimale
  if (!parsed.title || !parsed.mode || !parsed.startAt) {
    throw new Error("Champs requis manquants dans la réponse");
  }

  return parsed;
}

// Génère un brief en langage naturel à partir des données d'un événement
const BRIEF_GENERATION_PROMPT = `Tu es un assistant qui génère des briefs d'événements en langage naturel.

À partir des données structurées d'un événement, génère un texte court et naturel (2-3 phrases max) qui résume l'événement.
Le texte doit être écrit comme si quelqu'un décrivait l'événement à un ami.

Inclus :
- Le type/titre de l'événement
- La date et l'heure
- Le lieu ou si c'est en ligne
- La capacité si limitée
- Un bref aperçu du contenu si une description existe

Réponds UNIQUEMENT avec le texte du brief, sans guillemets, sans explications.`;

export interface EventData {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  mode: "IN_PERSON" | "ONLINE";
  location?: string | null;
  startAt: Date;
  endAt?: Date | null;
  capacity?: number | null;
}

export async function generateBriefFromEvent(event: EventData): Promise<string> {
  const eventJson = JSON.stringify({
    title: event.title,
    subtitle: event.subtitle || undefined,
    description: event.description || undefined,
    mode: event.mode,
    location: event.location || undefined,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() || undefined,
    capacity: event.capacity || undefined,
  }, null, 2);

  const response = await getGroqClient().chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: BRIEF_GENERATION_PROMPT },
      { role: "user", content: `Données de l'événement :\n${eventJson}` },
    ],
    temperature: 0.3,
    max_tokens: 300,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Pas de réponse du modèle");
  }

  return content.trim();
}
