import { Participant } from '@/types';
import { mockUsers } from '@/data/mockUsers';
import { attemptService } from './attemptService';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export const participantService = {
  async getAll(): Promise<Participant[]> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('attempts')
          .select(`
            id,
            user_id,
            quiz_id,
            score,
            max_score,
            percentage,
            passed,
            started_at,
            submitted_at,
            time_taken,
            violations,
            status,
            profiles:user_id ( id, name, email, avatar_url )
          `)
          .order('started_at', { ascending: false });

        if (!error && data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return data.map((a: any) => {
            const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
            return {
              id: `part-${a.id}`,
              userId: a.user_id,
              quizId: a.quiz_id,
              userName: profile?.name || 'Participant',
              userEmail: profile?.email || '',
              userAvatar: profile?.avatar_url,
              status: a.status,
              score: a.score,
              maxScore: a.max_score,
              percentage: Number(a.percentage) || 0,
              passed: Boolean(a.passed),
              startedAt: a.started_at,
              submittedAt: a.submitted_at || undefined,
              timeTaken: a.time_taken || undefined,
              violations: Array.isArray(a.violations) ? a.violations.length : 0,
              attemptId: a.id,
            };
          });
        }
      } catch {
        // fallback
      }
    }

    const attempts = await attemptService.getAll();
    return attempts.map((a) => {
      const user = mockUsers.find((u) => u.id === a.userId);
      return {
        id: `part-${a.id}`,
        userId: a.userId,
        quizId: a.quizId,
        userName: user?.name || (a.userId === 'user-3' ? 'Jordan Lee' : a.userId === 'user-1' ? 'Admin User' : 'Participant'),
        userEmail: user?.email || (a.userId === 'user-3' ? 'user@quizora.dev' : 'participant@quizora.dev'),
        userAvatar: user?.avatar,
        status: a.status,
        score: a.score,
        maxScore: a.maxScore,
        percentage: a.percentage,
        passed: a.passed,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        timeTaken: a.timeTaken,
        violations: a.violations?.length || 0,
        attemptId: a.id,
      };
    });
  },

  async getByQuizId(quizId: string): Promise<Participant[]> {
    const all = await this.getAll();
    return all.filter((p) => p.quizId === quizId);
  },

  async getByUserId(userId: string): Promise<Participant[]> {
    const all = await this.getAll();
    return all.filter((p) => p.userId === userId);
  },

  async getQuizStats(quizId: string) {
    const participants = await this.getByQuizId(quizId);
    const total = participants.length;
    const attempted = participants.filter((p) => p.status !== 'not_attempted').length;
    const notAttempted = participants.filter((p) => p.status === 'not_attempted').length;
    const inProgress = participants.filter((p) => p.status === 'in_progress').length;
    const completed = participants.filter((p) => p.status === 'completed' || p.status === 'auto_submitted').length;
    const completedParticipants = participants.filter((p) => p.percentage !== undefined);
    const averageScore = completedParticipants.length > 0
      ? Math.round(completedParticipants.reduce((sum, p) => sum + (p.percentage ?? 0), 0) / completedParticipants.length * 10) / 10
      : 0;
    const passed = completedParticipants.filter((p) => p.passed).length;
    const passRate = completedParticipants.length > 0 ? Math.round((passed / completedParticipants.length) * 100) : 0;

    return { total, attempted, notAttempted, inProgress, completed, averageScore, passRate };
  },
};
