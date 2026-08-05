import { aiConfig } from "@/lib/config/ai.config";
import { KnowledgeArtifactService, type GroundingBatch } from "./knowledge-artifact.service";
import { parseGeneratedJson, quizSchema } from "./artifact-generation.utils";
export class QuizService extends KnowledgeArtifactService {
  public async generate(batches: GroundingBatch[], onProgress?: (completedBatches: number, totalBatches: number) => Promise<void>) {
    const intermediate = await this.summarizeBatches(batches, onProgress);
    return parseGeneratedJson(await this.provider.generate({ prompt: `Create up to ${aiConfig.knowledge.quizQuestionCount} grounded questions from these book summaries, balancing MULTIPLE_CHOICE, TRUE_FALSE, and SHORT_ANSWER. Use only supplied content. Return JSON {"items":[{"type":"...","question":"...","options":["..."],"answer":"...","explanation":"..."}]}; use [] options for non-multiple choice.\n\n${intermediate}` }), quizSchema);
  }
}
