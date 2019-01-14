import {Action} from '@ngrx/store';
import {Dictionary} from '../../../../common/dictionary';
import {Epic, EpicState, EpicUtil, initialEpicState} from './epic.model';

const DESERIALIZE_ALL_EPICS = 'DESERIALIZE_ALL_EPICS';

class DeserializeEpicsAction implements Action {
  readonly type = DESERIALIZE_ALL_EPICS;

  constructor(readonly payload: DeserializeEpicsPayload) {
  }
}

export interface DeserializeEpicsPayload {
  epicsByProject: Dictionary<Epic[]>;
}

export class EpicActions {
  static createDeserializeAll(input: any) {
    return new DeserializeEpicsAction(input);
  }
}

// 'meta-reducer here means it is not called directly by the store, rather from the boardReducer
export function epicMetaReducer(state: EpicState = initialEpicState, action: Action): EpicState {
  switch (action.type) {
    case DESERIALIZE_ALL_EPICS:
      return EpicUtil.stateFromJs((<DeserializeEpicsAction>action).payload);
  }
  return initialEpicState;
}

