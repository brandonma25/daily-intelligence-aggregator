export interface RankedSignal {
  cluster_id: string;
  score: number;
  score_breakdown: {
    credibility: number;
    novelty: number;
    urgency: number;
    reinforcement: number;
  };
}
