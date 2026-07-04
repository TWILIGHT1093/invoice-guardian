export interface StageConfig {
  stage: number;
  name: string;
  daysAfterDue: number;
}

export const DEFAULT_STAGES: StageConfig[] = [
  { stage: 1, name: "Friendly Nudge", daysAfterDue: 0 },
  { stage: 2, name: "Soft Deadline", daysAfterDue: 7 },
  { stage: 3, name: "Late Fee Notice", daysAfterDue: 14 },
  { stage: 4, name: "Escalation Warning", daysAfterDue: 30 },
];

export function calculateNextStage(
  currentStage: number,
  dueDate: Date,
  stageDays: number[] = [0, 7, 14, 30]
): { nextStage: number; nextDate: Date } | null {
  const now = new Date();
  const nextStage = currentStage + 1;

  if (nextStage > 4) return null;

  const daysAfterDue = stageDays[nextStage - 1];
  const nextDate = new Date(dueDate);
  nextDate.setDate(nextDate.getDate() + daysAfterDue);

  // If the scheduled date is in the past, schedule for now
  if (nextDate < now) {
    nextDate.setTime(now.getTime());
  }

  return { nextStage, nextDate };
}

export function getDaysOverdue(dueDate: Date): number {
  const now = new Date();
  const diffTime = now.getTime() - dueDate.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}
