export const KNOWLEDGE_ARTIFACT_TYPES = ["SUMMARY", "TAKEAWAYS", "FLASHCARDS", "QUIZ", "MIND_MAP"] as const;
export type KnowledgeArtifactType = (typeof KNOWLEDGE_ARTIFACT_TYPES)[number];
export const KNOWLEDGE_ARTIFACT_STATUSES = ["REQUESTED", "GENERATING", "RETRYING", "COMPLETED", "FAILED"] as const;
export type KnowledgeArtifactStatus = (typeof KNOWLEDGE_ARTIFACT_STATUSES)[number];
export const KNOWLEDGE_GENERATION_STAGES = ["LOADING_SEGMENTS", "PREPARING_BATCHES", "GENERATING_CONTENT", "VALIDATING", "SAVING"] as const;
export type KnowledgeGenerationStage = (typeof KNOWLEDGE_GENERATION_STAGES)[number];
export type KnowledgeGenerationStatus = "QUEUED" | "PROCESSING" | "RETRYING" | "CANCEL_REQUESTED" | "CANCELLED" | "COMPLETED" | "FAILED";

export interface KnowledgeCitation { segmentId: string; pageNumber: number }
export interface SummaryArtifact { executiveSummary: string; overview: string; mainThemes: string[]; importantConcepts: string[]; mainArguments: string[]; conclusion: string }
export interface TakeawayArtifact { items: { text: string; citations: KnowledgeCitation[] }[] }
export interface FlashcardArtifact { items: { question: string; answer: string; difficulty: "EASY" | "MEDIUM" | "HARD"; citations: KnowledgeCitation[] }[] }
export interface QuizArtifact { items: { type: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER"; question: string; options: string[]; answer: string; explanation: string; citations: KnowledgeCitation[] }[] }
export interface MindMapNode { topic: string; children: MindMapNode[] }
export interface MindMapArtifact { root: MindMapNode }
export interface KnowledgeArtifactRecord {
  id: string; bookId: string; clerkId: string; type: KnowledgeArtifactType; status: KnowledgeArtifactStatus;
  progress: number; generationStage?: KnowledgeGenerationStage; currentBatch?: number; totalBatches?: number; errorMessage?: string; sourceSegments: KnowledgeCitation[];
  summary?: SummaryArtifact; takeaways?: TakeawayArtifact; flashcards?: FlashcardArtifact; quiz?: QuizArtifact; mindMap?: MindMapArtifact;
  createdAt: string; updatedAt: string;
}
export interface KnowledgeGenerationRecord { id: string; artifactId: string; bookId: string; userId: string; artifactType: KnowledgeArtifactType; generationId: string; status: KnowledgeGenerationStatus; progress: number; generationStage?: KnowledgeGenerationStage; currentBatch?: number; totalBatches?: number; errorMessage?: string; createdAt: string; updatedAt: string }
export interface KnowledgeArtifactLifecycleRecord { completedArtifact?: KnowledgeArtifactRecord; activeGeneration?: KnowledgeGenerationRecord }
