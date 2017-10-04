import {Action} from '@ngrx/store';
import {List} from 'immutable';
import {FixVersionState, FixVersionUtil, initialFixVersionState} from './fix-version.model';
import {AppState} from '../../../app-store';
import {createSelector} from 'reselect';


const DESERIALIZE_ALL_FIX_VERSIONS = 'DESERIALIZE_ALL_FIX_VERSIONS';
const ADD_FIX_VERSIONS = 'ADD_FIX_VERSIONS';

class DeserializeFixVersionsAction implements Action {
  readonly type = DESERIALIZE_ALL_FIX_VERSIONS;

  constructor(readonly payload: List<string>) {
  }
}

class AddFixVersionsAction implements Action {
  readonly type = ADD_FIX_VERSIONS;

  constructor(readonly payload: List<string>) {
  }
}

export class FixVersionActions {
  static createDeserializeFixVersions(input: any): Action {
    const inputArray: string[] = input ? input : [];
    return new DeserializeFixVersionsAction(List<string>(inputArray));
  }

  static createAddFixVersions(input: any): Action {
    const inputArray: string[] = input ? input : [];
    return new AddFixVersionsAction(List<string>(inputArray));
  }
}

export function fixVersionReducer(state: FixVersionState = initialFixVersionState, action: Action): FixVersionState {

  switch (action.type) {
    case DESERIALIZE_ALL_FIX_VERSIONS: {
      const payload: List<string> = (<DeserializeFixVersionsAction>action).payload;
      const newState: FixVersionState = FixVersionUtil.toStateRecord(state).withMutations(mutable => {
        mutable.versions = payload;
      });
      if ((FixVersionUtil.toStateRecord(newState)).equals(FixVersionUtil.toStateRecord(state))) {
        return state;
      }
      return newState;
    }
    case ADD_FIX_VERSIONS: {
      const payload: List<string> = (<AddFixVersionsAction>action).payload;
      if (payload.size > 0) {

        const newFixVersions: List<string> = state.versions.concat(payload)
          .sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase())).toList();
        return FixVersionUtil.toStateRecord(state).withMutations(mutable => {
          mutable.versions = newFixVersions;
        });
      }
      return state;

    }
    default:
      return state;
  }
};

const getFixVersionsState = (state: AppState) => state.board.fixVersions
const getFixVersions = (state: FixVersionState) => state.versions;
export const fixVersionsSelector = createSelector(getFixVersionsState, getFixVersions);
