import { BookOpenText, Brain, Headphones, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const VOICE_PERSONAS = [
  {
    id: "wise-professor",
    name: "Wise Professor",
    description: "Thoughtful explanations with scholarly context.",
    icon: Brain,
    availability: "available",
  },
  {
    id: "friendly-companion",
    name: "Friendly Companion",
    description: "Warm, curious conversation for everyday learning.",
    icon: UserRound,
    availability: "available",
  },
  {
    id: "storyteller",
    name: "Storyteller",
    description: "Expressive narration for an immersive reading experience.",
    icon: BookOpenText,
    availability: "available",
  },
  {
    id: "technical-expert",
    name: "Technical Expert",
    description: "Precise, structured guidance for complex material.",
    icon: Headphones,
    availability: "available",
  },
] as const satisfies ReadonlyArray<{
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  availability: "available" | "coming-soon";
}>;

export type VoicePersonaId = (typeof VOICE_PERSONAS)[number]["id"];

export const VOICE_PERSONA_IDS = VOICE_PERSONAS.map((persona) => persona.id) as [
  VoicePersonaId,
  ...VoicePersonaId[],
];
