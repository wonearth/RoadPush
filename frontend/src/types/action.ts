import type { ActionType, LocationStatus } from "./risk";

/** 현장조치 이력. Firestore `actions` 컬렉션 문서에 대응한다. */
export interface ActionLog {
  id: string;
  locationId: string;
  status: LocationStatus;
  actionTypes: ActionType[];
  memo: string;
  createdAt: string;
  createdBy: string;
}

export interface UpdateActionInput {
  status: LocationStatus;
  actionTypes: ActionType[];
  memo: string;
}
