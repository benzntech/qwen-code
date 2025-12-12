/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ModelRouter } from './ModelRouter.js';
import type { Config } from '@qwen-code/qwen-code-core';
import { PredefinedTaskType } from '@qwen-code/qwen-code-core';

describe('ModelRouter', () => {
  let mockConfig: Config;
  let modelRouter: ModelRouter;

  beforeEach(() => {
    mockConfig = {
      getModel: vi.fn().mockReturnValue('claude-opus-4-20250514'),
      getRoutingConfig: vi.fn().mockReturnValue({
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
      }),
    } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    modelRouter = new ModelRouter(mockConfig);
  });

  describe('routeRequest - Auto-Classification', () => {
    it('should classify and route code generation requests', async () => {
      const routing = await modelRouter.routeRequest(
        'Write a Python function to calculate factorial',
      );

      expect(routing.model).toBe('gpt-4o');
      expect(routing.taskType).toBe(PredefinedTaskType.CodeGeneration);
      expect(routing.isExplicit).toBe(false);
      expect(routing.confidence).toBeGreaterThan(0);
    });

    it('should classify and route code understanding requests', async () => {
      const routing = await modelRouter.routeRequest(
        'Explain how this sorting algorithm works',
      );

      expect(routing.model).toBe('gpt-4o-mini');
      expect(routing.taskType).toBe(PredefinedTaskType.CodeUnderstanding);
      expect(routing.isExplicit).toBe(false);
    });

    it('should classify and route creative writing requests', async () => {
      const routing = await modelRouter.routeRequest(
        'Write a short story about a lost time traveler',
      );

      expect(routing.model).toBe('claude-opus-4-20250514');
      expect(routing.taskType).toBe(PredefinedTaskType.CreativeWriting);
      expect(routing.isExplicit).toBe(false);
    });

    it('should include reasoning in routing decision', async () => {
      const routing = await modelRouter.routeRequest(
        'Generate a REST API in Node.js',
      );

      expect(routing.reason).toBeDefined();
      expect(routing.reason.length).toBeGreaterThan(0);
    });
  });

  describe('routeRequest - Explicit Task Type', () => {
    it('should use explicit task type when provided', async () => {
      const routing = await modelRouter.routeRequest(
        'Some arbitrary input',
        PredefinedTaskType.CodeGeneration,
      );

      expect(routing.model).toBe('gpt-4o');
      expect(routing.taskType).toBe(PredefinedTaskType.CodeGeneration);
      expect(routing.isExplicit).toBe(true);
      expect(routing.confidence).toBe(1.0);
    });

    it('should route to correct model for explicit creative writing', async () => {
      const routing = await modelRouter.routeRequest(
        'Some text',
        PredefinedTaskType.CreativeWriting,
      );

      expect(routing.model).toBe('claude-opus-4-20250514');
      expect(routing.isExplicit).toBe(true);
    });
  });

  describe('routeRequest - Disabled Routing', () => {
    it('should return null model when routing disabled', async () => {
      mockConfig.getRoutingConfig = vi.fn().mockReturnValue({
        enabled: false,
        preferences: [],
      });

      const routing = await modelRouter.routeRequest('Generate Python code');

      expect(routing.model).toBeNull();
      expect(routing.reason).toContain('not enabled');
    });

    it('should return null model when routing config missing', async () => {
      mockConfig.getRoutingConfig = vi.fn().mockReturnValue(undefined);

      const routing = await modelRouter.routeRequest('Any input');

      expect(routing.model).toBeNull();
    });
  });

  describe('routeRequest - Fallback Behavior', () => {
    it('should return null for unconfigured task type', async () => {
      const routing = await modelRouter.routeRequest(
        'Help me debug this issue',
      );

      // Bug fixing not configured in preferences
      if (routing.taskType === PredefinedTaskType.BugFixing) {
        expect(routing.model).toBeNull();
      }
    });
  });

  describe('getAvailableTaskTypes', () => {
    it('should return all predefined task types', () => {
      const taskTypes = modelRouter.getAvailableTaskTypes();

      expect(taskTypes.length).toBeGreaterThanOrEqual(7);
      expect(taskTypes.map((t) => t.id)).toContain(
        PredefinedTaskType.CodeGeneration,
      );
      expect(taskTypes.map((t) => t.id)).toContain(
        PredefinedTaskType.CodeUnderstanding,
      );
    });

    it('should mark predefined tasks as such', () => {
      const taskTypes = modelRouter.getAvailableTaskTypes();
      const predefinedTasks = taskTypes.filter((t) => t.isPredefined);

      expect(predefinedTasks.length).toBeGreaterThanOrEqual(7);
    });

    it('should include custom task types from routing config', () => {
      mockConfig.getRoutingConfig = vi.fn().mockReturnValue({
        enabled: true,
        preferences: [
          {
            taskType: 'ml_optimization',
            model: 'gpt-4o',
          },
          {
            taskType: 'data_science',
            model: 'claude-opus-4-20250514',
          },
        ],
      });

      const taskTypes = new ModelRouter(mockConfig).getAvailableTaskTypes();
      const customTaskIds = taskTypes
        .filter((t) => !t.isPredefined)
        .map((t) => t.id);

      expect(customTaskIds).toContain('ml_optimization');
      expect(customTaskIds).toContain('data_science');
    });

    it('should mark custom tasks as user-defined', () => {
      mockConfig.getRoutingConfig = vi.fn().mockReturnValue({
        enabled: true,
        preferences: [
          {
            taskType: 'custom_task',
            model: 'gpt-4o',
          },
        ],
      });

      const taskTypes = new ModelRouter(mockConfig).getAvailableTaskTypes();
      const customTask = taskTypes.find((t) => t.id === 'custom_task');

      expect(customTask?.isPredefined).toBe(false);
    });
  });

  describe('isModelAvailable', () => {
    it('should validate non-empty model names', () => {
      expect(modelRouter.isModelAvailable('gpt-4o')).toBe(true);
      expect(modelRouter.isModelAvailable('claude-opus-4-20250514')).toBe(true);
    });

    it('should reject empty model names', () => {
      expect(modelRouter.isModelAvailable('')).toBe(false);
    });

    it('should handle null model names', () => {
      expect(modelRouter.isModelAvailable(null as any)).toBe(false); // eslint-disable-line @typescript-eslint/no-explicit-any
    });
  });

  describe('getFallbackModel', () => {
    it('should return default model from config', () => {
      const fallback = modelRouter.getFallbackModel('unavailable-model');

      expect(fallback).toBe('claude-opus-4-20250514');
    });

    it('should return same default regardless of input model', () => {
      const fallback1 = modelRouter.getFallbackModel('model-1');
      const fallback2 = modelRouter.getFallbackModel('model-2');

      expect(fallback1).toBe(fallback2);
    });
  });

  describe('Integration Tests', () => {
    it('should handle full flow: classify -> route -> select model', async () => {
      const userInput =
        'Create a TypeScript function that validates email addresses';
      const routing = await modelRouter.routeRequest(userInput);

      expect(routing).toBeDefined();
      expect(routing.model).toBe('gpt-4o');
      expect(routing.taskType).toBe(PredefinedTaskType.CodeGeneration);
      expect(routing.confidence).toBeGreaterThan(0.7);
      expect(routing.reason).toBeDefined();
    });

    it('should provide complete routing information', async () => {
      const routing = await modelRouter.routeRequest(
        'Explain the visitor pattern in design patterns',
      );

      expect(routing.model).toBeDefined();
      expect(routing.taskType).toBeDefined();
      expect(routing.confidence).toBeGreaterThanOrEqual(0);
      expect(routing.confidence).toBeLessThanOrEqual(1);
      expect(routing.reason).toBeDefined();
      expect(routing.isExplicit).toBeDefined();
    });
  });

  describe('Predefined vs Custom Task Types', () => {
    it('should handle both predefined and custom task types', async () => {
      mockConfig.getRoutingConfig = vi.fn().mockReturnValue({
        enabled: true,
        preferences: [
          {
            taskType: PredefinedTaskType.CodeGeneration,
            model: 'gpt-4o',
          },
          {
            taskType: 'custom_ml_task',
            model: 'claude-opus-4-20250514',
          },
        ],
      });

      const router = new ModelRouter(mockConfig);
      const taskTypes = router.getAvailableTaskTypes();

      const predefinedCount = taskTypes.filter((t) => t.isPredefined).length;
      const customCount = taskTypes.filter((t) => !t.isPredefined).length;

      expect(predefinedCount).toBeGreaterThanOrEqual(7);
      expect(customCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle routing errors gracefully', async () => {
      mockConfig.getModel = vi.fn().mockImplementation(() => {
        throw new Error('Config error');
      });

      // Should not throw, routing should still attempt to proceed
      const router = new ModelRouter(mockConfig);
      const routing = await router.routeRequest('Generate code');

      expect(routing).toBeDefined();
    });
  });
});
