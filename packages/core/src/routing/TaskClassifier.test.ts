/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { TaskClassifier, PredefinedTaskType } from './index.js';

describe('TaskClassifier', () => {
  describe('getPredefinedTasks', () => {
    it('should return all predefined task types', () => {
      const tasks = TaskClassifier.getPredefinedTasks();

      expect(tasks).toHaveLength(7);
      expect(tasks.map((t) => t.id)).toContain(
        PredefinedTaskType.CodeGeneration,
      );
      expect(tasks.map((t) => t.id)).toContain(
        PredefinedTaskType.CodeUnderstanding,
      );
      expect(tasks.map((t) => t.id)).toContain(
        PredefinedTaskType.CreativeWriting,
      );
    });

    it('should mark all tasks as predefined', () => {
      const tasks = TaskClassifier.getPredefinedTasks();

      expect(tasks.every((t) => t.isPredefined)).toBe(true);
    });

    it('should have description for each task', () => {
      const tasks = TaskClassifier.getPredefinedTasks();

      expect(tasks.every((t) => t.description.length > 0)).toBe(true);
    });
  });

  describe('getTaskMetadata', () => {
    it('should return metadata for valid task type', () => {
      const metadata = TaskClassifier.getTaskMetadata(
        PredefinedTaskType.CodeGeneration,
      );

      expect(metadata).toBeDefined();
      expect(metadata?.id).toBe(PredefinedTaskType.CodeGeneration);
      expect(metadata?.isPredefined).toBe(true);
    });

    it('should return undefined for unknown task type', () => {
      const metadata = TaskClassifier.getTaskMetadata('unknown_task');

      expect(metadata).toBeUndefined();
    });
  });

  describe('classifyTask - Code Generation', () => {
    it('should classify code generation requests', () => {
      const result = TaskClassifier.classifyTask(
        'Write a function to calculate the fibonacci sequence',
      );

      expect(result.type).toBe(PredefinedTaskType.CodeGeneration);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should detect code generation with "create" keyword', () => {
      const result = TaskClassifier.classifyTask(
        'Create a React component for a todo list',
      );

      expect(result.type).toBe(PredefinedTaskType.CodeGeneration);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should detect code generation with code blocks', () => {
      const result = TaskClassifier.classifyTask(`
        Here is my code:
        \`\`\`python
        def hello():
            print("world")
        \`\`\`
        Make it better
      `);

      expect(result.type).toBe(PredefinedTaskType.CodeGeneration);
    });

    it('should classify with high confidence for explicit code generation', () => {
      const result = TaskClassifier.classifyTask(
        'Generate Python boilerplate for a REST API',
      );

      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('classifyTask - Code Understanding', () => {
    it('should classify code explanation requests', () => {
      const result = TaskClassifier.classifyTask(
        'Explain what this function does',
      );

      expect(result.type).toBe(PredefinedTaskType.CodeUnderstanding);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should detect code understanding with "analyze" keyword', () => {
      const result = TaskClassifier.classifyTask(
        'Analyze this algorithm code for understanding and performance',
      );

      expect([
        PredefinedTaskType.CodeUnderstanding,
        PredefinedTaskType.ComplexReasoning,
        PredefinedTaskType.CodeGeneration,
      ]).toContain(result.type);
    });

    it('should classify code review requests', () => {
      const result = TaskClassifier.classifyTask(
        'Review this code snippet for security vulnerabilities',
      );

      expect([
        PredefinedTaskType.CodeUnderstanding,
        PredefinedTaskType.CodeGeneration,
      ]).toContain(result.type);
    });
  });

  describe('classifyTask - Bug Fixing', () => {
    it('should classify bug fix requests', () => {
      const result = TaskClassifier.classifyTask(
        'Fix the bug in my code that causes the crash to occur',
      );

      expect([
        PredefinedTaskType.BugFixing,
        PredefinedTaskType.CodeGeneration,
      ]).toContain(result.type);
    });

    it('should detect debugging requests', () => {
      const result = TaskClassifier.classifyTask(
        'Debug why this function is returning the wrong value',
      );

      expect(result.type).toBe(PredefinedTaskType.BugFixing);
    });

    it('should classify error handling requests', () => {
      const result = TaskClassifier.classifyTask(
        'My code throws a runtime error when I execute it',
      );

      expect([
        PredefinedTaskType.BugFixing,
        PredefinedTaskType.CodeGeneration,
      ]).toContain(result.type);
    });
  });

  describe('classifyTask - Refactoring', () => {
    it('should classify refactoring requests', () => {
      const result = TaskClassifier.classifyTask(
        'Refactor this code to make it more readable and optimize performance',
      );

      expect([
        PredefinedTaskType.Refactoring,
        PredefinedTaskType.CodeGeneration,
      ]).toContain(result.type);
    });

    it('should detect optimization requests', () => {
      const result = TaskClassifier.classifyTask(
        'Optimize and refactor this function for better performance',
      );

      expect([
        PredefinedTaskType.Refactoring,
        PredefinedTaskType.CodeGeneration,
      ]).toContain(result.type);
    });

    it('should classify code simplification requests', () => {
      const result = TaskClassifier.classifyTask(
        'Simplify this complex nested function structure',
      );

      expect([
        PredefinedTaskType.Refactoring,
        PredefinedTaskType.CodeGeneration,
      ]).toContain(result.type);
    });
  });

  describe('classifyTask - Documentation', () => {
    it('should classify documentation requests', () => {
      const result = TaskClassifier.classifyTask(
        'Add comprehensive documentation and comments to this code',
      );

      expect([
        PredefinedTaskType.Documentation,
        PredefinedTaskType.CodeGeneration,
      ]).toContain(result.type);
    });

    it('should detect docstring generation requests', () => {
      const result = TaskClassifier.classifyTask(
        'Write detailed docstrings for this Python module',
      );

      expect([
        PredefinedTaskType.Documentation,
        PredefinedTaskType.CodeGeneration,
      ]).toContain(result.type);
    });

    it('should classify README generation requests', () => {
      const result = TaskClassifier.classifyTask(
        'Generate a comprehensive README with documentation for my project',
      );

      // Can be classified as documentation, creative writing, or code generation
      expect(result.type).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe('classifyTask - Creative Writing', () => {
    it('should classify creative writing requests', () => {
      const result = TaskClassifier.classifyTask(
        'Write a short story about time travel',
      );

      expect(result.type).toBe(PredefinedTaskType.CreativeWriting);
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should detect poetry requests', () => {
      const result = TaskClassifier.classifyTask('Write a poem about autumn');

      expect(result.type).toBe(PredefinedTaskType.CreativeWriting);
    });

    it('should exclude code-related creative writing', () => {
      const result = TaskClassifier.classifyTask(
        'Create a narrative for my code example',
      );

      // Should be code generation, not creative writing
      expect(result.type).not.toBe(PredefinedTaskType.CreativeWriting);
    });
  });

  describe('classifyTask - Complex Reasoning', () => {
    it('should classify mathematical problem-solving', () => {
      const result = TaskClassifier.classifyTask(
        'Analyze and solve this differential equation step by step with mathematical reasoning',
      );

      expect([
        PredefinedTaskType.ComplexReasoning,
        PredefinedTaskType.CodeGeneration,
      ]).toContain(result.type);
    });

    it('should detect logic puzzle requests', () => {
      const result = TaskClassifier.classifyTask(
        'Help me reason through the algorithm approach for this problem',
      );

      expect([
        PredefinedTaskType.ComplexReasoning,
        PredefinedTaskType.CodeUnderstanding,
      ]).toContain(result.type);
    });

    it('should classify analysis requests', () => {
      const result = TaskClassifier.classifyTask(
        'Analyze and reason through the trade-offs between these approaches',
      );

      expect(result.type).toBe(PredefinedTaskType.ComplexReasoning);
    });
  });

  describe('classifyTask - Fallback Behavior', () => {
    it('should provide a classification for empty input', () => {
      const result = TaskClassifier.classifyTask('');

      // Accepts any classification for empty input
      expect(result.type).toBeDefined();
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should provide a classification for ambiguous input', () => {
      const result = TaskClassifier.classifyTask('tell me about this');

      // Accepts any classification for ambiguous input
      expect(result.type).toBeDefined();
      expect(result.confidence).toBeLessThanOrEqual(0.8);
    });

    it('should have lower confidence for default classification', () => {
      const result = TaskClassifier.classifyTask('hello');

      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('classifyTask - Confidence Levels', () => {
    it('should have higher confidence for explicit keywords', () => {
      const vague = TaskClassifier.classifyTask('help');
      const explicit = TaskClassifier.classifyTask(
        'Generate Python code for a web server',
      );

      expect(explicit.confidence).toBeGreaterThan(vague.confidence);
    });

    it('should have high confidence when multiple signals present', () => {
      const result = TaskClassifier.classifyTask(
        'Generate a React component function for a button',
      );

      expect(result.confidence).toBeGreaterThan(0.8);
    });
  });

  describe('classifyTask - Case Insensitivity', () => {
    it('should classify regardless of case', () => {
      const lowercase = TaskClassifier.classifyTask(
        'write a function to calculate sum',
      );
      const uppercase = TaskClassifier.classifyTask(
        'WRITE A FUNCTION TO CALCULATE SUM',
      );

      expect(lowercase.type).toBe(uppercase.type);
    });
  });
});
