import { KnowledgeArtifactService, type GroundingBatch } from "./knowledge-artifact.service";
import { parseGeneratedJson, summarySchema } from "./artifact-generation.utils";
export class SummaryService extends KnowledgeArtifactService {
  public async generate(batches: GroundingBatch[], onProgress?: (completedBatches: number, totalBatches: number) => Promise<void>) {
    const intermediate = await this.summarizeBatches(batches, onProgress);
    return parseGeneratedJson(await this.provider.generate({ prompt: `Create a book summary from the grounded intermediate summaries below. Use only this material. Return JSON with executiveSummary, overview, mainThemes, importantConcepts, mainArguments, conclusion; all values except the three lists must be strings.\n\n${intermediate}` }), summarySchema);
  }
}
