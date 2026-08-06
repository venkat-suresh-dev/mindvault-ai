import { aiConfig } from "@/lib/config/ai.config";
import { KnowledgeArtifactService, type BatchSummaryCheckpoint, type GroundingBatch } from "./knowledge-artifact.service";
import { mindMapSchema, parseGeneratedJson } from "./artifact-generation.utils";
export class MindMapService extends KnowledgeArtifactService {
  public async generate(batches: GroundingBatch[], onProgress: ((completedBatches: number, totalBatches: number) => Promise<void>) | undefined, signal: AbortSignal | undefined, checkpoint: BatchSummaryCheckpoint) {
    const intermediate = await this.summarizeBatches(batches, onProgress, signal, checkpoint);
    return { root: parseGeneratedJson(await this.provider.generate({ prompt: `Create a grounded book mind map from these summaries. Return only JSON {"topic":"...","children":[...]}; every child has topic and children. Do not exceed depth ${aiConfig.knowledge.maxMindMapDepth}.\n\n${intermediate}`, signal, onAttempt: checkpoint.onProviderAttempt }), mindMapSchema) };
  }
}
