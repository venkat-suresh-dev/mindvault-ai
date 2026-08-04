export interface RetrievedSegment {
  id: string;
  segmentIndex: number;
  pageNumber: number;
  text: string;
  score: number;
}

export interface Citation {
  page: number;
  segmentId: string;
}

export interface RetrievalResult {
  segments: RetrievedSegment[];
  citations: Citation[];
}
