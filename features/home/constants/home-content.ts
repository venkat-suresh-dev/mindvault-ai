import { FileUp, MessageCircle, Mic, Sparkles, WandSparkles } from "lucide-react";
import type { HomeStep } from "@/features/home/types/home";

export const HOME_CONTENT = {
  hero: {
    eyebrow: "Your personal intelligence layer",
    title: ["Your knowledge library,", "powered by AI."],
    description:
      "Turn books, documents, and notes into a living source of insight. Search instantly, ask grounded questions, and have natural voice conversations with everything you know.",
    primaryAction: "Add New Book",
    secondaryAction: "Explore your library",
    illustration: {
      src: "/images/mindvault-library-hero.png",
      alt: "Vintage books transforming into an intelligent connected knowledge library",
    },
  },
  library: {
    eyebrow: "Knowledge workspace",
    title: "Your Library",
    description:
      "Continue conversations with the ideas you care about, or add a new source to your personal AI memory.",
  },
  howItWorks: {
    eyebrow: "How it works",
    title: "From pages to conversation",
  },
  emptyLibrary: {
    title: "Your library is empty",
    description: "Upload your first PDF to start chatting with your books.",
    action: "Upload Book",
  },
} as const;

export const HOW_IT_WORKS_STEPS: HomeStep[] = [
  {
    icon: FileUp,
    title: "Upload your document",
    description: "Bring in books, notes, and source material.",
  },
  {
    icon: Mic,
    title: "Choose your AI voice",
    description: "Set the conversation style that fits your workflow.",
  },
  {
    icon: WandSparkles,
    title: "MindVault processes your knowledge",
    description: "Your content becomes organized, searchable context.",
  },
  {
    icon: MessageCircle,
    title: "Start chatting naturally",
    description: "Ask, search, and explore ideas grounded in your sources.",
  },
];

export const HERO_ICONS = {
  eyebrow: Sparkles,
} as const;
