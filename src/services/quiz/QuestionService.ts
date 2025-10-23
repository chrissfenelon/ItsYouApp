import { QuizQuestion, QuizOption } from '../../types/quizCouple.types';
import {
  QUIZ_QUESTIONS,
  getRandomQuestions as getRandomQuestionsFromData,
  getQuestionsByCategory,
  getQuestionsByDifficulty,
} from '../../data/quiz/questions';

export class QuestionService {
  /**
   * Sélectionner des questions aléatoires
   */
  static selectQuestions(
    count: number = 10,
    difficulty?: 'facile' | 'moyen' | 'difficile',
    categories?: string[]
  ): QuizQuestion[] {
    let pool = [...QUIZ_QUESTIONS];

    // Filtrer par difficulté si spécifié
    if (difficulty) {
      pool = pool.filter(q => q.difficulty === difficulty);
    }

    // Filtrer par catégories si spécifié
    if (categories && categories.length > 0) {
      pool = pool.filter(q => categories.includes(q.categoryId));
    }

    // Mélanger et prendre le nombre demandé
    const shuffled = pool.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    // Mélanger les options de chaque question
    return selected.map(q => ({
      ...q,
      options: this.shuffleOptions(q.options),
    }));
  }

  /**
   * Mélanger les options de réponse
   */
  static shuffleOptions(options: QuizOption[]): QuizOption[] {
    return [...options].sort(() => 0.5 - Math.random());
  }

  /**
   * Valider une réponse
   */
  static validateAnswer(question: QuizQuestion, answerId: string): boolean {
    return question.correctAnswerId === answerId;
  }

  /**
   * Calculer le score pour une réponse
   */
  static calculateScore(
    isCorrect: boolean,
    difficulty: 'facile' | 'moyen' | 'difficile',
    timeSpent: number,
    timeLimit: number = 15
  ): number {
    if (!isCorrect) {
      return 0;
    }

    // Points de base selon la difficulté
    const basePoints = {
      facile: 10,
      moyen: 15,
      difficile: 20,
    }[difficulty];

    // Calculer le bonus de vitesse
    const timeRatio = timeSpent / timeLimit;
    let speedBonus = 0;

    if (timeRatio <= 0.33) {
      // Très rapide (0-33% du temps) : +50%
      speedBonus = 0.5;
    } else if (timeRatio <= 0.66) {
      // Rapide (33-66% du temps) : +25%
      speedBonus = 0.25;
    }
    // Normal (66-100% du temps) : +0%

    return Math.round(basePoints * (1 + speedBonus));
  }

  /**
   * Obtenir des questions équilibrées (mix de difficultés)
   */
  static getBalancedQuestions(count: number = 10): QuizQuestion[] {
    // Distribution : 40% facile, 40% moyen, 20% difficile
    const easyCount = Math.floor(count * 0.4);
    const mediumCount = Math.floor(count * 0.4);
    const hardCount = count - easyCount - mediumCount;

    const easy = this.selectQuestions(easyCount, 'facile');
    const medium = this.selectQuestions(mediumCount, 'moyen');
    const hard = this.selectQuestions(hardCount, 'difficile');

    // Mélanger toutes les questions
    return [...easy, ...medium, ...hard].sort(() => 0.5 - Math.random());
  }

  /**
   * Obtenir des questions par catégorie avec mix de difficultés
   */
  static getQuestionsByCategories(
    categories: string[],
    count: number = 10
  ): QuizQuestion[] {
    const questionsPerCategory = Math.ceil(count / categories.length);
    const allQuestions: QuizQuestion[] = [];

    categories.forEach(categoryId => {
      const categoryQuestions = getQuestionsByCategory(categoryId);
      const shuffled = categoryQuestions.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, questionsPerCategory);
      allQuestions.push(...selected);
    });

    // Mélanger toutes les questions et prendre le nombre exact demandé
    const shuffled = allQuestions.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    // Mélanger les options de chaque question
    return selected.map(q => ({
      ...q,
      options: this.shuffleOptions(q.options),
    }));
  }

  /**
   * Obtenir la catégorie avec le meilleur taux de réussite
   */
  static getBestCategory(
    questions: QuizQuestion[],
    answers: Array<{ questionId: string; isCorrect: boolean }>
  ): string {
    const categoryScores: Record<string, { correct: number; total: number }> = {};

    answers.forEach((answer) => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question) {
        if (!categoryScores[question.categoryId]) {
          categoryScores[question.categoryId] = { correct: 0, total: 0 };
        }
        categoryScores[question.categoryId].total++;
        if (answer.isCorrect) {
          categoryScores[question.categoryId].correct++;
        }
      }
    });

    // Trouver la catégorie avec le meilleur ratio
    let bestCategory = '';
    let bestScore = 0;

    Object.entries(categoryScores).forEach(([category, stats]) => {
      if (stats.total > 0) {
        const score = stats.correct / stats.total;
        if (score > bestScore) {
          bestScore = score;
          bestCategory = category;
        }
      }
    });

    return bestCategory || 'unknown';
  }

  /**
   * Obtenir des statistiques sur un ensemble de réponses
   */
  static getAnswerStatistics(
    questions: QuizQuestion[],
    answers: Array<{
      questionId: string;
      isCorrect: boolean;
      timeSpent: number;
      points: number;
    }>
  ) {
    const correctCount = answers.filter(a => a.isCorrect).length;
    const totalPoints = answers.reduce((sum, a) => sum + a.points, 0);
    const averageTime = answers.reduce((sum, a) => sum + a.timeSpent, 0) / answers.length;

    const categoryStats: Record<string, { correct: number; total: number }> = {};

    answers.forEach((answer) => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question) {
        if (!categoryStats[question.categoryId]) {
          categoryStats[question.categoryId] = { correct: 0, total: 0 };
        }
        categoryStats[question.categoryId].total++;
        if (answer.isCorrect) {
          categoryStats[question.categoryId].correct++;
        }
      }
    });

    return {
      correctCount,
      totalQuestions: questions.length,
      totalPoints,
      averageTime: Math.round(averageTime * 10) / 10,
      successRate: Math.round((correctCount / questions.length) * 100),
      categoryStats,
    };
  }
}
