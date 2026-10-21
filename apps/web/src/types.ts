export interface Metric {
  metric: string;
  value: number;
  unit: string;
  date_range: string[];
  source_id: string;
  query_id: string;
}
export interface Answer {
  question: string;
  status: string;
  finding: string;
  supporting_metrics: Metric[];
  caveats: string[];
  recommended_action: string;
  expected_direction: string;
  how_to_test: string;
  confidence_label: string;
  needs_human_review: boolean;
  trace: {
    provider: string;
    prompt_version: string;
    tools: string[];
    model: string | null;
    tokens: number | null;
    cost_usd: number | null;
    api_calls: number;
    attempts: number;
    elapsed_ms: number;
    query_ids?: string[];
    evidence_rows?: unknown;
    execution?: string;
    error_code?: string;
  };
}
export interface Snapshot {
  source: {
    id: string;
    label: string;
    currency: string;
    timezone: string;
    start: string;
    end: string;
    sampling: string;
    generated_at?: string;
    obfuscation: string;
  };
  window: string[];
  channel: string;
  query_id: string;
  metrics: Metric[];
  funnel: { name: string; value: number; rate: number; step_rate: number }[];
  channels: {
    channel: string;
    sessions: number;
    purchases: number;
    conversion: number;
  }[];
  trend: { day: string; sessions: number; purchases: number }[];
  quality: Record<string, number>;
  transactions: number;
  decision: {
    step: string | null;
    lost_sessions: number;
    action: string;
    caveat: string;
  };
  attribution: { status: string; reason: string };
  answers: Record<string, Answer>;
}
export interface EvalCase {
  id: string;
  category: string;
  prompt_version: string;
  question: string;
  expected_status: string;
  actual_status: string;
  expected_tool: string | null;
  actual_tools: string[];
  scores: Record<string, boolean>;
  passed: boolean;
  elapsed_ms: number;
  tokens: number | null;
  cost_usd: number | null;
  api_calls: number;
  failure_review: string | null;
}
export interface EvalRun {
  run_at: string;
  provider: string;
  kind: string;
  model: string | null;
  case_count: number;
  versions: Record<string, { passed: number; total: number }>;
  results: EvalCase[];
}
