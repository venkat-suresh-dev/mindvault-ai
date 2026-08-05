import { aiConfig } from "@/lib/config/ai.config";
import { KnowledgeArtifactService, type GroundingBatch } from "./knowledge-artifact.service";
import { flashcardsSchema, parseGeneratedJson } from "./artifact-generation.utils";
export class FlashcardService extends KnowledgeArtifactService {
  public async generate(batches: GroundingBatch[], onProgress?: (completedBatches: number, totalBatches: number) => Promise<void>) {
    const intermediate = await this.summarizeBatches(batches, onProgress);
    return parseGeneratedJson(await this.provider.generate({ prompt: `Create up to ${aiConfig.knowledge.flashcardCount} grounded study flashcards from these book summaries. Use only supplied material. Return JSON {"items":[{"question":"...","answer":"...","difficulty":"EASY|MEDIUM|HARD"}]}.\n\n${intermediate}` }), flashcardsSchema);
  }
}
