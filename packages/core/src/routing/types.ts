/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Predefined task types supported by the routing system.
 * Users can also define custom task types in their configuration.
 */
export enum PredefinedTaskType {
  CodeGeneration = 'code_generation',
  CodeUnderstanding = 'code_understanding',
  CreativeWriting = 'creative_writing',
  ComplexReasoning = 'complex_reasoning',
  BugFixing = 'bug_fixing',
  Refactoring = 'refactoring',
  Documentation = 'documentation',
}

/**
 * Result of task classification analysis
 */
export interface TaskClassification {
  /** The identified task type */
  type: string;

  /** Confidence level (0-1) for this classification */
  confidence: number;

  /** Explanation of why this task type was chosen */
  reasoning: string;
}

/**
 * Routing preference mapping a task type to a model
 */
export interface RoutingPreference {
  /** The task type identifier (e.g., 'code_generation', custom task type) */
  taskType: string;

  /** The model to use for this task type */
  model: string;
}

/**
 * Routing configuration stored in settings
 */
export interface RoutingConfig {
  /** Whether task-based routing is enabled */
  enabled: boolean;

  /** Array of task type to model mappings */
  preferences: RoutingPreference[];
}

/**
 * Result of routing decision
 */
export interface RoutingDecision {
  /** The model selected by routing (null if no preference matched) */
  model: string | null;

  /** The classified or explicit task type */
  taskType: string;

  /** Confidence level of the classification (0-1) */
  confidence: number;

  /** Explanation of the routing decision */
  reason: string;

  /** Whether this was explicit (user-selected) or auto-classified */
  isExplicit: boolean;
}

/**
 * Metadata about a task type
 */
export interface TaskTypeMetadata {
  /** The task type identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Description of what this task type is for */
  description: string;

  /** Whether this is a predefined type or user-defined */
  isPredefined: boolean;
}
