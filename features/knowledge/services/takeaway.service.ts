import { KnowledgeArtifactService, type BatchSummaryCheckpoint, type GroundingBatch } from "./knowledge-artifact.service";
import { parseGeneratedJson, takeawaysSchema } from "./artifact-generation.utils";
export class TakeawayService extends KnowledgeArtifactService {
  public async generate(batches: GroundingBatch[], onProgress: ((completedBatches: number, totalBatches: number) => Promise<void>) | undefined, signal: AbortSignal | undefined, checkpoint: BatchSummaryCheckpoint) {
    const intermediate = await this.summarizeBatches(batches, onProgress, signal, checkpoint);
    return parseGeneratedJson(await this.provider.generate({ prompt: `Extract concise, non-overlapping learning takeaways from these grounded book summaries. Use only supplied content. Return JSON {"items":[{"text":"..."}]}.\n\n${intermediate}`, signal, onAttempt: checkpoint.onProviderAttempt }), takeawaysSchema);
  }
}
