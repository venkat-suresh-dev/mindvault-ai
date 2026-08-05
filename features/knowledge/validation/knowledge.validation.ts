import { z } from "zod";
import { KNOWLEDGE_ARTIFACT_TYPES } from "@/features/knowledge/types/knowledge";
export const knowledgeArtifactRequestSchema = z.object({ type: z.enum(KNOWLEDGE_ARTIFACT_TYPES) });
