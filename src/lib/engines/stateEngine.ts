export enum IncidentState {
  NEW = 1,
  IN_PROGRESS = 2,
  ON_HOLD = 3,
  RESOLVED = 6,
  CLOSED = 7,
  CANCELED = 8,
}

const ALLOWED_TRANSITIONS: Record<IncidentState, IncidentState[]> = {
  [IncidentState.NEW]: [IncidentState.IN_PROGRESS, IncidentState.CANCELED],
  [IncidentState.IN_PROGRESS]: [IncidentState.ON_HOLD, IncidentState.RESOLVED, IncidentState.CANCELED],
  [IncidentState.ON_HOLD]: [IncidentState.IN_PROGRESS, IncidentState.RESOLVED, IncidentState.CANCELED],
  [IncidentState.RESOLVED]: [IncidentState.IN_PROGRESS, IncidentState.CLOSED],
  [IncidentState.CLOSED]: [],
  [IncidentState.CANCELED]: [],
};

export function canTransition(current: IncidentState, next: IncidentState): boolean {
  return ALLOWED_TRANSITIONS[current]?.includes(next) ?? false;
}

export function assertTransition(current: IncidentState, next: IncidentState): void {
  if (current === next) return;
  if (!canTransition(current, next)) {
    throw new Error(`Illegal state transition from ${current} to ${next}`);
  }
}
