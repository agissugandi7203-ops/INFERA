import type { RagSearchResult } from './rag.types.js';

/**
 * Native OpenAI / OpenRouter Tool Calling Specification
 */
export interface AiToolFunctionDefinition {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
  };
}

export interface AiToolDefinition {
  type: 'function';
  function: AiToolFunctionDefinition;
}

export interface AiToolCallFunction {
  name: string;
  arguments: string; // JSON string
}

export interface AiToolCall {
  id: string;
  type: 'function';
  function: AiToolCallFunction;
  index?: number;
}

export interface AiToolCallDelta {
  index: number;
  id?: string;
  type?: 'function';
  function?: {
    name?: string;
    arguments?: string;
  };
}

/**
 * Risk Assessment & Anomaly Signal Typologies
 */
export type InvestigationRiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface FraudAnomalySignal {
  type: string;
  label: string;
  severity: InvestigationRiskLevel;
  description: string;
  evidence?: string;
  scoreContribution?: number;
}

/**
 * Two-Phase Action Recommendation (Phase 1 Output)
 */
export type ActionRecommendationType =
  | 'NAVIGATE'
  | 'PROPOSE_SUSPENSION'
  | 'PROPOSE_WARNING_LETTER'
  | 'AUDIT_CASE';

export interface ActionRecommendation {
  id: string;
  title: string;
  description: string;
  riskScore: number; // 0 - 100
  riskLevel: InvestigationRiskLevel;
  reason: string;
  signals: FraudAnomalySignal[];
  actionLabel: string;
  actionType: ActionRecommendationType;
  targetId: string;
  targetName?: string;
  targetRoute?: string;
  requiresConfirmation: boolean;
  legalBasis?: string;
  suggestedData?: Record<string, unknown>;
  citations?: RagSearchResult[];
  timestamp: string;
}

/**
 * Real-time Tool Execution Progress Events for UI
 */
export type ToolExecutionEventType =
  | 'tool.start'
  | 'tool.progress'
  | 'tool.complete'
  | 'tool.error'
  | 'recommendation.created';

export interface ToolProgressStep {
  id: string;
  toolName: string;
  label: string;
  status: 'running' | 'completed' | 'failed';
  detail?: string;
  timestamp: string;
}

export interface ToolExecutionEvent {
  type: ToolExecutionEventType;
  toolCallId: string;
  toolName: string;
  label: string;
  detail?: string;
  result?: unknown;
  recommendation?: ActionRecommendation;
  error?: string;
}
