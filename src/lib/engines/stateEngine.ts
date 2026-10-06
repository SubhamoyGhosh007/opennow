export enum IncidentState {
  NEW = 1,
  IN_PROGRESS = 2,
  ON_HOLD = 3,
  RESOLVED = 6,
  CLOSED = 7,
  CANCELED = 8,
}

export enum ProblemState {
  OPEN = 1,
  INVESTIGATION = 2,
  KNOWN_ERROR = 3,
  RESOLVED = 6,
  CLOSED = 7,
  CANCELED = 8,
}

export enum ChangeState {
  NEW = 1,
  ASSESS = 2,
  SCHEDULED = 3,
  IMPLEMENTING = 4,
  REVIEW = 6,
  CLOSED = 7,
  CANCELED = 8,
}

const INCIDENT_TRANSITIONS: Record<number, number[]> = {
  [IncidentState.NEW]: [IncidentState.IN_PROGRESS, IncidentState.CANCELED],
  [IncidentState.IN_PROGRESS]: [IncidentState.ON_HOLD, IncidentState.RESOLVED, IncidentState.CANCELED],
  [IncidentState.ON_HOLD]: [IncidentState.IN_PROGRESS, IncidentState.RESOLVED, IncidentState.CANCELED],
  [IncidentState.RESOLVED]: [IncidentState.IN_PROGRESS, IncidentState.CLOSED],
  [IncidentState.CLOSED]: [],
  [IncidentState.CANCELED]: [],
};

const PROBLEM_TRANSITIONS: Record<number, number[]> = {
  [ProblemState.OPEN]: [ProblemState.INVESTIGATION, ProblemState.CANCELED],
  [ProblemState.INVESTIGATION]: [ProblemState.KNOWN_ERROR, ProblemState.RESOLVED, ProblemState.CANCELED],
  [ProblemState.KNOWN_ERROR]: [ProblemState.RESOLVED, ProblemState.INVESTIGATION, ProblemState.CANCELED],
  [ProblemState.RESOLVED]: [ProblemState.INVESTIGATION, ProblemState.CLOSED],
  [ProblemState.CLOSED]: [],
  [ProblemState.CANCELED]: [],
};

const CHANGE_TRANSITIONS: Record<number, number[]> = {
  [ChangeState.NEW]: [ChangeState.ASSESS, ChangeState.CANCELED],
  [ChangeState.ASSESS]: [ChangeState.NEW, ChangeState.SCHEDULED, ChangeState.CANCELED],
  [ChangeState.SCHEDULED]: [ChangeState.IMPLEMENTING, ChangeState.ASSESS, ChangeState.CANCELED],
  [ChangeState.IMPLEMENTING]: [ChangeState.REVIEW, ChangeState.SCHEDULED, ChangeState.CANCELED],
  [ChangeState.REVIEW]: [ChangeState.CLOSED, ChangeState.IMPLEMENTING, ChangeState.CANCELED],
  [ChangeState.CLOSED]: [],
  [ChangeState.CANCELED]: [],
};

export function canTransition(current: number, next: number, table = "incident"): boolean {
  if (table === "problem") {
    return PROBLEM_TRANSITIONS[current]?.includes(next) ?? false;
  }
  if (table === "change_request" || table === "change") {
    return CHANGE_TRANSITIONS[current]?.includes(next) ?? false;
  }
  return INCIDENT_TRANSITIONS[current]?.includes(next) ?? false;
}

export function assertTransition(current: number, next: number, table = "incident"): void {
  if (current === next) return;
  if (!canTransition(current, next, table)) {
    throw new Error(`Illegal state transition for ${table} from state ${current} to ${next}`);
  }
}

