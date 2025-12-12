/**
 * @license
 * Copyright 2025 Qwen
 * SPDX-License-Identifier: Apache-2.0
 */

import type {
  TaskClassification,
  TaskTypeMetadata} from './types.js';
import {
  PredefinedTaskType
} from './types.js';

/**
 * Classifies user input into task types for preference-aligned routing
 */
export class TaskClassifier {
  /**
   * Predefined task type definitions
   */
  private static readonly PREDEFINED_TASKS: Record<string, TaskTypeMetadata> = {
    [PredefinedTaskType.CodeGeneration]: {
      id: PredefinedTaskType.CodeGeneration,
      name: 'Code Generation',
      description:
        'Generating new code snippets, functions, or boilerplate based on user prompts',
      isPredefined: true,
    },
    [PredefinedTaskType.CodeUnderstanding]: {
      id: PredefinedTaskType.CodeUnderstanding,
      name: 'Code Understanding',
      description:
        'Understanding and explaining existing code snippets, functions, or libraries',
      isPredefined: true,
    },
    [PredefinedTaskType.CreativeWriting]: {
      id: PredefinedTaskType.CreativeWriting,
      name: 'Creative Writing',
      description:
        'Creative content generation, storytelling, and writing assistance',
      isPredefined: true,
    },
    [PredefinedTaskType.ComplexReasoning]: {
      id: PredefinedTaskType.ComplexReasoning,
      name: 'Complex Reasoning',
      description:
        'Deep analysis, mathematical problem solving, and logical reasoning',
      isPredefined: true,
    },
    [PredefinedTaskType.BugFixing]: {
      id: PredefinedTaskType.BugFixing,
      name: 'Bug Fixing',
      description: 'Identifying and fixing bugs in code',
      isPredefined: true,
    },
    [PredefinedTaskType.Refactoring]: {
      id: PredefinedTaskType.Refactoring,
      name: 'Refactoring',
      description: 'Improving code structure without changing behavior',
      isPredefined: true,
    },
    [PredefinedTaskType.Documentation]: {
      id: PredefinedTaskType.Documentation,
      name: 'Documentation',
      description: 'Writing and improving code documentation',
      isPredefined: true,
    },
  };

  /**
   * Get all predefined task types
   */
  static getPredefinedTasks(): TaskTypeMetadata[] {
    return Object.values(TaskClassifier.PREDEFINED_TASKS);
  }

  /**
   * Get metadata for a specific predefined task type
   */
  static getTaskMetadata(
    taskType: string,
  ): TaskTypeMetadata | undefined {
    return TaskClassifier.PREDEFINED_TASKS[taskType];
  }

  /**
   * Classify user input into a task type using keyword matching and heuristics
   *
   * @param input - The user input text to classify
   * @returns TaskClassification with identified task type and confidence
   */
  static classifyTask(input: string): TaskClassification {
    const lowerInput = input.toLowerCase();

    // Code generation signals
    if (
      /\b(generate|create|write|implement|make|build|construct|code)\b/.test(
        lowerInput,
      ) &&
      (/\b(function|class|method|component|module|library|script|api)\b/.test(
        lowerInput,
      ) ||
        /\b(code|snippet|boilerplate|example)\b/.test(lowerInput))
    ) {
      return {
        type: PredefinedTaskType.CodeGeneration,
        confidence: 0.85,
        reasoning:
          'Input contains keywords suggesting new code generation (create, generate, write, function, class, component)',
      };
    }

    // Code understanding signals
    if (
      /\b(explain|understand|analyze|review|check|interpret|what does|how does|describe|summarize)\b/.test(
        lowerInput,
      ) &&
      (/\b(code|function|class|method|snippet|library|module|file)\b/.test(
        lowerInput,
      ) ||
        /```[\s\S]*?```/.test(lowerInput))
    ) {
      return {
        type: PredefinedTaskType.CodeUnderstanding,
        confidence: 0.85,
        reasoning:
          'Input contains keywords suggesting code analysis and explanation (explain, analyze, review, understand)',
      };
    }

    // Bug fixing signals
    if (
      /\b(bug|fix|error|crash|broken|issue|problem|debug|wrong|not working|failing|exception)\b/.test(
        lowerInput,
      ) &&
      (/\b(code|function|method|script|program|application)\b/.test(
        lowerInput,
      ) ||
        /```[\s\S]*?```/.test(lowerInput))
    ) {
      return {
        type: PredefinedTaskType.BugFixing,
        confidence: 0.85,
        reasoning:
          'Input contains keywords suggesting bug fixing (bug, fix, error, debug, broken)',
      };
    }

    // Refactoring signals
    if (
      /\b(refactor|improve|optimize|clean|simplify|reorganize|restructure|rewrite)\b/.test(
        lowerInput,
      ) &&
      (/\b(code|function|class|method|structure|design|architecture)\b/.test(
        lowerInput,
      ) ||
        /```[\s\S]*?```/.test(lowerInput))
    ) {
      return {
        type: PredefinedTaskType.Refactoring,
        confidence: 0.85,
        reasoning:
          'Input contains keywords suggesting code refactoring (refactor, improve, optimize, simplify)',
      };
    }

    // Documentation signals
    if (
      /\b(document|comment|document|docstring|readme|javadoc|jsdoc|explain how to|usage|tutorial|guide|example)\b/.test(
        lowerInput,
      ) &&
      (/\b(code|function|class|method|module|api|library)\b/.test(lowerInput) ||
        /```[\s\S]*?```/.test(lowerInput))
    ) {
      return {
        type: PredefinedTaskType.Documentation,
        confidence: 0.8,
        reasoning:
          'Input contains keywords suggesting documentation tasks (document, comment, docstring, readme)',
      };
    }

    // Creative writing signals
    if (
      /\b(write|create|compose|tell|story|poem|narrative|essay|article|blog|fiction|imagine|creative)\b/.test(
        lowerInput,
      ) &&
      !/\b(code|function|class|program|script|algorithm)\b/.test(lowerInput)
    ) {
      return {
        type: PredefinedTaskType.CreativeWriting,
        confidence: 0.8,
        reasoning:
          'Input contains creative writing keywords without code-related terms (write, story, creative)',
      };
    }

    // Complex reasoning signals
    if (
      /\b(analyze|think|reason|solve|calculate|derive|prove|explain why|how|logic|algorithm|approach|design)\b/.test(
        lowerInput,
      ) &&
      (/\b(problem|question|challenge|puzzle|math|physics|algorithm|pattern)\b/.test(
        lowerInput,
      ) ||
        /[+\-*/=<>]/.test(lowerInput))
    ) {
      return {
        type: PredefinedTaskType.ComplexReasoning,
        confidence: 0.75,
        reasoning:
          'Input contains keywords suggesting complex reasoning (analyze, solve, think, algorithm)',
      };
    }

    // Default to code generation if code is present
    if (/```[\s\S]*?```/.test(lowerInput)) {
      return {
        type: PredefinedTaskType.CodeGeneration,
        confidence: 0.6,
        reasoning:
          'Code block detected in input; defaulting to code generation',
      };
    }

    // Default fallback
    return {
      type: PredefinedTaskType.CodeGeneration,
      confidence: 0.4,
      reasoning:
        'No specific task type signals found; defaulting to code generation',
    };
  }
}
