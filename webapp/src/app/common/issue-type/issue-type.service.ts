import {Injectable} from '@angular/core';
import {AppState} from '../../app-store';
import {Action, Store} from '@ngrx/store';
import {IssueType, IssueTypeFactory} from './issue-type.model';
import * as Immutable from 'immutable';
import {createSelector} from 'reselect';
import {Observable} from 'rxjs/Observable';


const DESERIALIZE_ALL_ISSUE_TYPES = 'DESERIALIZE_ALL_ISSUE_TYPES';

class DeserializeIssueTypesAction implements Action {
  readonly type = DESERIALIZE_ALL_ISSUE_TYPES;

  constructor(readonly payload: IssueType[]) {
  }
}

export interface IssueTypeState {
  types: Immutable.OrderedMap<string, IssueType>;
}

export const initialState = {
  types: Immutable.OrderedMap<string, IssueType>()
};

export function reducer(state: IssueTypeState = initialState, action: Action): IssueTypeState {

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


@Injectable()
export class IssueTypeService {

  constructor(private store: Store<AppState>) {
  }

  getIssueTypes(): Observable<Immutable.OrderedMap<string, IssueType>> {
    return this.store.select(issuesTypesSelector);
  }

  deserializeIssueTypes(input: any) {
    const inputArray: any[] = input ? input : [];
    const issueTypes = new Array<IssueType>(inputArray.length);
    inputArray.forEach((type, i) => {
      issueTypes[i] = IssueTypeFactory.fromJS(type);
    });


    this.store.dispatch(new DeserializeIssueTypesAction(issueTypes));
  }
}

