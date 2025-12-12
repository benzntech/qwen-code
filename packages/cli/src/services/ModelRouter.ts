/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Config } from '../config/config.js';
import type {
  RoutingDecision} from '@qwen-code/qwen-code-core';
import {
  TaskClassifier,
  RoutingPreferences
} from '@qwen-code/qwen-code-core';

/**
 * ModelRouter orchestrates task classification and routing
 * to select the best model for a given user input
 */
export class ModelRouter {
  /**
   * Creates a new ModelRouter instance
   *
   * @param config - The CLI configuration object
   */
  constructor(private config: Config) {}

  /**
   * Route a user request to the best model based on task classification
   *
   * @param userInput - The user's input text
   * @param explicitTaskType - Optional explicit task type from user
   * @returns RoutingDecision with selected model and reasoning
   */
  async routeRequest(
    userInput: string,
    explicitTaskType?: string,
  ): Promise<RoutingDecision> {
    // Get routing preferences from config
    const routingConfig = this.config.getRoutingConfig();

    // If routing is disabled, return empty decision
    if (!routingConfig || !routingConfig.enabled) {
      return {
        model: null,
        taskType: 'unknown',
        confidence: 0,
        reason: 'Task-based routing is not enabled',
        isExplicit: false,
      };
    }

    // Create routing preferences matcher
    const preferences = new RoutingPreferences(routingConfig);

    // If user explicitly selected a task type, use that
    if (explicitTaskType) {
      const decision = preferences.makeDecision(
        {
          type: explicitTaskType,
          confidence: 1.0,
          reasoning: 'User explicitly selected this task type',
        },
        true,
      );

      return decision;
    }

    // Otherwise, auto-classify the task
    const classification = TaskClassifier.classifyTask(userInput);

    // Make routing decision based on classification
    const decision = preferences.makeDecision(classification, false);

    return decision;
  }

  /**
   * Get all available task types (predefined + user-defined)
   *
   * @returns Array of all available task types with metadata
   */
  getAvailableTaskTypes() {
    const routingConfig = this.config.getRoutingConfig();
    const predefinedTasks = TaskClassifier.getPredefinedTasks();

    if (!routingConfig) {
      return predefinedTasks;
    }

    // Get user-defined task types
    const userDefinedTypes = routingConfig.preferences
      .map((p) => p.taskType)
      .filter((type) => !predefinedTasks.find((t) => t.id === type));

    // Convert user-defined types to metadata
    const userDefinedMetadata = userDefinedTypes.map((type) => ({
      id: type,
      name: type.replace(/_/g, ' '),
      description: `Custom task type: ${type}`,
      isPredefined: false,
    }));

    return [...predefinedTasks, ...userDefinedMetadata];
  }

  /**
   * Validate that a model is available
   *
   * @param model - The model name to validate
   * @returns true if the model appears to be available, false otherwise
   */
  isModelAvailable(model: string): boolean {
    // For now, we do basic validation
    // In the future, this could check against available models
    return model && model.length > 0;
  }

  /**
   * Get fallback model if the preferred model is unavailable
   *
   * @param preferredModel - The model that was preferred
   * @returns The fallback model (current default model from config)
   */
  getFallbackModel(_preferredModel: string): string {
    // Return the default model from config as fallback
    return this.config.getModel();
  }
}
