/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  RoutingPreferences,
  PredefinedTaskType,
  type RoutingConfig,
} from './index.js';

describe('RoutingPreferences', () => {
  const mockConfig: RoutingConfig = {
    enabled: true,
    preferences: [
      {
        taskType: PredefinedTaskType.CodeGeneration,
        model: 'gpt-4o',
      },
      {
        taskType: PredefinedTaskType.CodeUnderstanding,
        model: 'gpt-4o-mini',
      },
      {
        taskType: PredefinedTaskType.CreativeWriting,
        model: 'claude-opus-4-20250514',
      },
    ],
  };

  describe('makeDecision - With Enabled Routing', () => {
    it('should match task type to configured model', () => {
      const preferences = new RoutingPreferences(mockConfig);
      const decision = preferences.makeDecision(
        {
          type: PredefinedTaskType.CodeGeneration,
          confidence: 0.9,
          reasoning: 'Code generation detected',
        },
        false,
      );

      expect(decision.model).toBe('gpt-4o');
      expect(decision.taskType).toBe(PredefinedTaskType.CodeGeneration);
      expect(decision.confidence).toBe(0.9);
      expect(decision.isExplicit).toBe(false);
    });

    it('should include reasoning in decision', () => {
      const preferences = new RoutingPreferences(mockConfig);
      const decision = preferences.makeDecision(
        {
          type: PredefinedTaskType.CodeUnderstanding,
          confidence: 0.85,
          reasoning: 'User asked to explain code',
        },
        false,
      );

      expect(decision.reason).toContain('gpt-4o-mini');
      expect(decision.reason).toContain('85%');
      expect(decision.reason).toContain('User asked to explain code');
    });

    it('should handle explicit task selection', () => {
      const preferences = new RoutingPreferences(mockConfig);
      const decision = preferences.makeDecision(
        {
          type: PredefinedTaskType.CreativeWriting,
          confidence: 1.0,
          reasoning: 'User explicitly selected creative writing',
        },
        true,
      );

      expect(decision.model).toBe('claude-opus-4-20250514');
      expect(decision.isExplicit).toBe(true);
    });

    it('should return null for unconfigured task type', () => {
      const preferences = new RoutingPreferences(mockConfig);
      const decision = preferences.makeDecision(
        {
          type: PredefinedTaskType.BugFixing,
          confidence: 0.8,
          reasoning: 'Bug fixing detected',
        },
        false,
      );

      expect(decision.model).toBeNull();
      expect(decision.reason).toContain('No routing preference');
      expect(decision.reason).toContain(PredefinedTaskType.BugFixing);
    });
  });

  describe('makeDecision - With Disabled Routing', () => {
    it('should return null model when routing disabled', () => {
      const disabledConfig: RoutingConfig = {
        enabled: false,
        preferences: mockConfig.preferences,
      };
      const preferences = new RoutingPreferences(disabledConfig);
      const decision = preferences.makeDecision(
        {
          type: PredefinedTaskType.CodeGeneration,
          confidence: 0.9,
          reasoning: 'Code generation',
        },
        false,
      );

      expect(decision.model).toBeNull();
      expect(decision.reason).toContain('routing is disabled');
    });
  });

  describe('hasPreferenceForTaskType', () => {
    it('should return true for configured task type', () => {
      const preferences = new RoutingPreferences(mockConfig);

      expect(
        preferences.hasPreferenceForTaskType(PredefinedTaskType.CodeGeneration),
      ).toBe(true);
    });

    it('should return false for unconfigured task type', () => {
      const preferences = new RoutingPreferences(mockConfig);

      expect(
        preferences.hasPreferenceForTaskType(PredefinedTaskType.BugFixing),
      ).toBe(false);
    });
  });

  describe('getModelForTaskType', () => {
    it('should return model for configured task type', () => {
      const preferences = new RoutingPreferences(mockConfig);
      const model = preferences.getModelForTaskType(
        PredefinedTaskType.CodeUnderstanding,
      );

      expect(model).toBe('gpt-4o-mini');
    });

    it('should return undefined for unconfigured task type', () => {
      const preferences = new RoutingPreferences(mockConfig);
      const model = preferences.getModelForTaskType('unknown_task');

      expect(model).toBeUndefined();
    });
  });

  describe('getConfiguredTaskTypes', () => {
    it('should return all configured task types', () => {
      const preferences = new RoutingPreferences(mockConfig);
      const taskTypes = preferences.getConfiguredTaskTypes();

      expect(taskTypes).toHaveLength(3);
      expect(taskTypes).toContain(PredefinedTaskType.CodeGeneration);
      expect(taskTypes).toContain(PredefinedTaskType.CodeUnderstanding);
      expect(taskTypes).toContain(PredefinedTaskType.CreativeWriting);
    });

    it('should return empty array for no preferences', () => {
      const emptyConfig: RoutingConfig = {
        enabled: true,
        preferences: [],
      };
      const preferences = new RoutingPreferences(emptyConfig);
      const taskTypes = preferences.getConfiguredTaskTypes();

      expect(taskTypes).toHaveLength(0);
    });
  });

  describe('isEnabled', () => {
    it('should return true when routing enabled', () => {
      const preferences = new RoutingPreferences(mockConfig);

      expect(preferences.isEnabled()).toBe(true);
    });

    it('should return false when routing disabled', () => {
      const disabledConfig: RoutingConfig = {
        enabled: false,
        preferences: mockConfig.preferences,
      };
      const preferences = new RoutingPreferences(disabledConfig);

      expect(preferences.isEnabled()).toBe(false);
    });
  });

  describe('getPreferenceCount', () => {
    it('should return correct count of preferences', () => {
      const preferences = new RoutingPreferences(mockConfig);

      expect(preferences.getPreferenceCount()).toBe(3);
    });

    it('should handle empty preferences', () => {
      const emptyConfig: RoutingConfig = {
        enabled: true,
        preferences: [],
      };
      const preferences = new RoutingPreferences(emptyConfig);

      expect(preferences.getPreferenceCount()).toBe(0);
    });
  });

  describe('Confidence Handling', () => {
    it('should preserve classification confidence in decision', () => {
      const preferences = new RoutingPreferences(mockConfig);
      const classification = {
        type: PredefinedTaskType.CodeGeneration,
        confidence: 0.65,
        reasoning: 'Weak signal',
      };
      const decision = preferences.makeDecision(classification, false);

      expect(decision.confidence).toBe(0.65);
    });

    it('should handle high confidence classification', () => {
      const preferences = new RoutingPreferences(mockConfig);
      const classification = {
        type: PredefinedTaskType.CodeGeneration,
        confidence: 0.99,
        reasoning: 'Strong signal',
      };
      const decision = preferences.makeDecision(classification, false);

      expect(decision.confidence).toBe(0.99);
    });
  });

  describe('Custom Task Types', () => {
    it('should support custom task types', () => {
      const customConfig: RoutingConfig = {
        enabled: true,
        preferences: [
          {
            taskType: 'ml_optimization',
            model: 'gpt-4o',
          },
          {
            taskType: 'data_analysis',
            model: 'claude-opus-4-20250514',
          },
        ],
      };
      const preferences = new RoutingPreferences(customConfig);
      const decision = preferences.makeDecision(
        {
          type: 'ml_optimization',
          confidence: 0.9,
          reasoning: 'Custom task type',
        },
        false,
      );

      expect(decision.model).toBe('gpt-4o');
      expect(decision.taskType).toBe('ml_optimization');
    });

    it('should return null for unconfigured custom task type', () => {
      const customConfig: RoutingConfig = {
        enabled: true,
        preferences: [
          {
            taskType: 'ml_optimization',
            model: 'gpt-4o',
          },
        ],
      };
      const preferences = new RoutingPreferences(customConfig);
      const decision = preferences.makeDecision(
        {
          type: 'unknown_custom_task',
          confidence: 0.8,
          reasoning: 'Unknown custom task',
        },
        false,
      );

      expect(decision.model).toBeNull();
    });
  });

  describe('Model Names with Special Characters', () => {
    it('should handle models with hyphens and dots', () => {
      const specialConfig: RoutingConfig = {
        enabled: true,
        preferences: [
          {
            taskType: PredefinedTaskType.CodeGeneration,
            model: 'gpt-4-turbo-2024-04-09',
          },
          {
            taskType: PredefinedTaskType.CodeUnderstanding,
            model: 'claude-opus-4-20250514',
          },
        ],
      };
      const preferences = new RoutingPreferences(specialConfig);
      const model = preferences.getModelForTaskType(
        PredefinedTaskType.CodeGeneration,
      );

      expect(model).toBe('gpt-4-turbo-2024-04-09');
    });
  });

  describe('Multiple Preferences Per Model', () => {
    it('should allow multiple task types to map to same model', () => {
      const multiConfig: RoutingConfig = {
        enabled: true,
        preferences: [
          {
            taskType: PredefinedTaskType.CodeGeneration,
            model: 'gpt-4o',
          },
          {
            taskType: PredefinedTaskType.CodeUnderstanding,
            model: 'gpt-4o',
          },
          {
            taskType: PredefinedTaskType.BugFixing,
            model: 'gpt-4o',
          },
        ],
      };
      const preferences = new RoutingPreferences(multiConfig);

      expect(
        preferences.getModelForTaskType(PredefinedTaskType.CodeGeneration),
      ).toBe('gpt-4o');
      expect(
        preferences.getModelForTaskType(PredefinedTaskType.CodeUnderstanding),
      ).toBe('gpt-4o');
      expect(
        preferences.getModelForTaskType(PredefinedTaskType.BugFixing),
      ).toBe('gpt-4o');
    });
  });
});
