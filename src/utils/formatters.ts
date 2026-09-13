export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatTimeTaken(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = d.getUTCDate();
  const month = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const day = d.getUTCDate();
  const month = MONTHS[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  return `${month} ${day}, ${year} ${hours}:${minutes}`;
}

export function getGreeting(name?: string): string {
  if (name) return `Good to see you, ${name}!`;
  return 'Good to see you, User!';
}

export function isValidUuid(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('');
}

export function difficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'easy':          return 'badge-success';
    case 'medium':
    case 'intermediate':  return 'badge-warning';
    case 'hard':          return 'badge-error';
    default:              return 'badge-neutral';
  }
}

export function statusColor(status: string): string {
  switch (status) {
    case 'published':     return 'badge-success';
    case 'draft':         return 'badge-warning';
    case 'closed':        return 'badge-neutral';
    case 'completed':     return 'badge-success';
    case 'in_progress':   return 'badge-info';
    case 'not_attempted': return 'badge-neutral';
    case 'auto_submitted':return 'badge-error';
    default:              return 'badge-neutral';
  }
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    published: 'Published',
    draft: 'Draft',
    closed: 'Closed',
    completed: 'Completed',
    in_progress: 'In Progress',
    not_attempted: 'Not Attempted',
    auto_submitted: 'Auto-submitted',
  };
  return labels[status] ?? status;
}

export function difficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: 'Easy',
    medium: 'Medium',
    intermediate: 'Intermediate',
    hard: 'Hard',
  };
  return labels[difficulty] ?? difficulty;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
