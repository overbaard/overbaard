import {AppState} from '../../app-store';
import {Action} from '@ngrx/store';
import {IssueType, IssueTypeFactory} from './issue-type.model';
import * as Immutable from 'immutable';
import {createSelector} from 'reselect';


const DESERIALIZE_ALL_ISSUE_TYPES = 'DESERIALIZE_ALL_ISSUE_TYPES';

class DeserializeIssueTypesAction implements Action {
  readonly type = DESERIALIZE_ALL_ISSUE_TYPES;

  constructor(readonly payload: IssueType[]) {
  }
}

export class IssueTypeActions {
  static createDeserializeIssueTypes(input: any): Action {
    const inputArray: any[] = input ? input : [];
    const issueTypes = new Array<IssueType>(inputArray.length);
    inputArray.forEach((type, i) => {
      issueTypes[i] = IssueTypeFactory.fromJS(type);
    });

    return new DeserializeIssueTypesAction(issueTypes);
  }
}

export interface IssueTypeState {
  types: Immutable.OrderedMap<string, IssueType>;
}

export const initialIssueTypeState = {
  types: Immutable.OrderedMap<string, IssueType>()
};

export function issueTypeReducer(state: IssueTypeState = initialIssueTypeState, action: Action): IssueTypeState {

  switch (action.type) {
    case DESERIALIZE_ALL_ISSUE_TYPES: {
      const payload: IssueType[] = (<DeserializeIssueTypesAction>action).payload;
      let types = state.types;
      types = types.withMutations(mutable => {
        for (const type of payload) {
          mutable.set(type.name, type);
        }
      });
      return {
        types: types
      };
    }
    default:
      return state;
  }
};

const getIssueTypesState = (state: AppState) => state.board.issueTypes;
const getTypes = (state: IssueTypeState) => state.types;
export const issuesTypesSelector = createSelector(getIssueTypesState, getTypes);

