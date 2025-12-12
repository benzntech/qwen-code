/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import type { RoutingConfig, RoutingDecision, TaskClassification } from './types.js';

/**
 * Matches task classifications to preferred models based on routing configuration
 */
export class RoutingPreferences {
  /**
   * Creates a new RoutingPreferences instance
   *
   * @param config - The routing configuration from settings
   */
  constructor(private config: RoutingConfig) {}

  /**
   * Make a routing decision based on task classification
   *
   * @param classification - The task classification result
   * @param isExplicit - Whether this was user-selected (explicit) or auto-classified
   * @returns RoutingDecision with selected model and reasoning
   */
  makeDecision(
    classification: TaskClassification,
    isExplicit: boolean = false,
  ): RoutingDecision {
    // If routing is disabled, return null model
    if (!this.config.enabled) {
      return {
        model: null,
        taskType: classification.type,
        confidence: classification.confidence,
        reason: 'Task-based routing is disabled in settings',
        isExplicit,
      };
    }

    // Find matching preference for this task type
    const preference = this.config.preferences.find(
      (p) => p.taskType === classification.type,
    );

    if (preference) {
      return {
        model: preference.model,
        taskType: classification.type,
        confidence: classification.confidence,
        reason: `Routed to ${preference.model} based on task type "${classification.type}" with ${(classification.confidence * 100).toFixed(0)}% confidence. ${classification.reasoning}`,
        isExplicit,
      };
    }

    // No preference found for this task type
    return {
      model: null,
      taskType: classification.type,
      confidence: classification.confidence,
      reason: `No routing preference configured for task type "${classification.type}". Falling back to default model.`,
      isExplicit,
    };
  }

  /**
   * Check if a routing preference exists for a given task type
   *
   * @param taskType - The task type to check
   * @returns true if a preference exists for this task type
   */
  hasPreferenceForTaskType(taskType: string): boolean {
    return this.config.preferences.some((p) => p.taskType === taskType);
  }

  /**
   * Get the configured model for a task type
   *
   * @param taskType - The task type to look up
   * @returns The configured model name, or undefined if not configured
   */
  getModelForTaskType(taskType: string): string | undefined {
    return this.config.preferences.find((p) => p.taskType === taskType)?.model;
  }

  /**
   * Get all configured task types
   *
   * @returns Array of all configured task types
   */
  getConfiguredTaskTypes(): string[] {
    return this.config.preferences.map((p) => p.taskType);
  }

  /**
   * Check if routing is enabled
   *
   * @returns true if task-based routing is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get the number of preferences configured
   *
   * @returns Number of task type to model mappings
   */
  getPreferenceCount(): number {
    return this.config.preferences.length;
  }
}
