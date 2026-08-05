import { aiConfig } from "@/lib/config/ai.config";
import { KnowledgeArtifactService, type GroundingBatch } from "./knowledge-artifact.service";
import { mindMapSchema, parseGeneratedJson } from "./artifact-generation.utils";
export class MindMapService extends KnowledgeArtifactService {
  public async generate(batches: GroundingBatch[], onProgress?: (completedBatches: number, totalBatches: number) => Promise<void>) {
    const intermediate = await this.summarizeBatches(batches, onProgress);
    return { root: parseGeneratedJson(await this.provider.generate({ prompt: `Create a grounded book mind map from these summaries. Return only JSON {"topic":"...","children":[...]}; every child has topic and children. Do not exceed depth ${aiConfig.knowledge.maxMindMapDepth}.\n\n${intermediate}` }), mindMapSchema) };
  }
}
