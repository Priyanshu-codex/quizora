import { Quiz, Participant, QuizAnalytics } from '@/types';
export type { QuizAnalytics };
import { quizService } from './quizService';
import { participantService } from './participantService';

export const resultService = {
  computeAnalytics(quizzes: Quiz[], allParticipants: Participant[]): QuizAnalytics[] {
    return quizzes.map((quiz) => {
      const participants = allParticipants.filter((p) => p.quizId === quiz.id);
      const total = participants.length;
      const attempted = participants.filter((p) => p.status !== 'not_attempted').length;
      const completed = participants.filter((p) => p.status === 'completed' || p.status === 'auto_submitted').length;
      const completedOnes = participants.filter((p) => p.percentage !== undefined);
      const averagePercentage = completedOnes.length > 0
        ? Math.round(completedOnes.reduce((s, p) => s + (p.percentage ?? 0), 0) / completedOnes.length * 10) / 10
        : 0;
      const averageScore = completedOnes.length > 0
        ? Math.round(completedOnes.reduce((s, p) => s + (p.score ?? 0), 0) / completedOnes.length)
        : 0;
      const passed = completedOnes.filter((p) => p.passed).length;
      const passRate = completedOnes.length > 0 ? Math.round((passed / completedOnes.length) * 100) : 0;
      const avgTimeTaken = completedOnes.length > 0
        ? Math.round(completedOnes.reduce((s, p) => s + (p.timeTaken ?? 0), 0) / completedOnes.length)
        : 0;

      const ranges = ['0–20%', '21–40%', '41–60%', '61–80%', '81–100%'];
      const distribution = ranges.map((range, i) => {
        const [low, high] = [i * 20 + 1, (i + 1) * 20];
        const count = completedOnes.filter((p) => {
          const pct = p.percentage ?? 0;
          return pct >= (i === 0 ? 0 : low) && pct <= high;
        }).length;
        return { range, count };
      });

      return {
        quizId: quiz.id,
        quizTitle: quiz.title,
        totalParticipants: total,
        attempted,
        notAttempted: total - attempted,
        inProgress: participants.filter((p) => p.status === 'in_progress').length,
        completed,
        averageScore,
        averagePercentage,
        passRate,
        averageTimeTaken: avgTimeTaken,
        scoreDistribution: distribution,
        difficultyBreakdown: { correct: passed, incorrect: completed - passed, unanswered: total - attempted },
      };
    });
  },

  computeSummary(quizzes: Quiz[], allParticipants: Participant[]) {
    const totalQuizzes = quizzes.length;
    const published = quizzes.filter((q) => q.status === 'published').length;
    const totalParticipants = new Set(allParticipants.map((p) => p.userId)).size;
    const totalAttempts = allParticipants.filter((p) => p.status !== 'not_attempted').length;
    const completedAttemptsList = allParticipants.filter((p) => p.status === 'completed' || p.status === 'auto_submitted');
    const completedAttempts = completedAttemptsList.length;
    const completedOnes = allParticipants.filter((p) => p.percentage !== undefined);
    const avgScore = completedOnes.length > 0
      ? Math.round(completedOnes.reduce((s, p) => s + (p.percentage ?? 0), 0) / completedOnes.length * 10) / 10
      : 0;

    return { totalQuizzes, published, totalParticipants, totalAttempts, completedAttempts, avgScore };
  },

  getCachedOverallAnalytics(): QuizAnalytics[] {
    const quizzes = quizService.getCachedAll();
    const participants = participantService.getCachedAll();
    return this.computeAnalytics(quizzes, participants);
  },

  getCachedAdminSummary() {
    const quizzes = quizService.getCachedAll();
    const participants = participantService.getCachedAll();
    return this.computeSummary(quizzes, participants);
  },

  async getOverallAnalytics(): Promise<QuizAnalytics[]> {
    const [quizzes, allParticipants] = await Promise.all([
      quizService.getAll(),
      participantService.getAll(),
    ]);
    return this.computeAnalytics(quizzes, allParticipants);
  },

  async getByQuizId(quizId: string): Promise<QuizAnalytics | null> {
    const all = await this.getOverallAnalytics();
    return all.find((a) => a.quizId === quizId) ?? null;
  },

  async getAdminSummary() {
    const [quizzes, allParticipants] = await Promise.all([
      quizService.getAll(),
      participantService.getAll(),
    ]);
    return this.computeSummary(quizzes, allParticipants);
  },

  async getDashboardData() {
    const [quizzes, allParticipants] = await Promise.all([
      quizService.getAll(),
      participantService.getAll(),
    ]);
    const summary = this.computeSummary(quizzes, allParticipants);
    const analytics = this.computeAnalytics(quizzes, allParticipants);
    return { summary, analytics, quizzes };
  },
};
