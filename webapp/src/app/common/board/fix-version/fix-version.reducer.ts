import {Action} from '@ngrx/store';
import {List} from 'immutable';
import {FixVersionState, FixVersionStateModifier, FixVersionStateRecord, initialFixVersionState} from './fix-version.model';


const DESERIALIZE_ALL_FIX_VERSIONS = 'DESERIALIZE_ALL_FIX_VERSIONS';

class DeserializeFixVersionsAction implements Action {
  readonly type = DESERIALIZE_ALL_FIX_VERSIONS;

  constructor(readonly payload: List<string>) {
  }
}

export class FixVersionActions {
  static createDeserializeFixVersions(input: any): Action {
    const inputArray: string[] = input ? input : [];
    return new DeserializeFixVersionsAction(List<string>(inputArray));
  }
}

export function fixVersionReducer(state: FixVersionState = initialFixVersionState, action: Action): FixVersionState {

  switch (action.type) {
    case DESERIALIZE_ALL_FIX_VERSIONS: {
      const payload: List<string> = (<DeserializeFixVersionsAction>action).payload;
      const newState: FixVersionState = FixVersionStateModifier.update(state, copy => {
        copy.versions = payload;
      });
      if ((<FixVersionStateRecord>newState).equals(<FixVersionStateRecord>state)) {
        return state;
      }
      return newState;
    }
    default:
      return state;
  }
};
