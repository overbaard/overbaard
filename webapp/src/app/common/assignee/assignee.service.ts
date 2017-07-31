import {Action, Store} from '@ngrx/store';
import {Assignee} from './assignee.model';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {AppState} from '../../app-store';
import {createSelector} from 'reselect';
import * as Immutable from 'immutable';

const ADD_ASSIGNEES = 'ADD_ASSIGNEES';
const CLEAR_ASSIGNEES = 'CLEAR_ASSIGNEES';
// TODO remove this. We should not be modifying assignees, I just want something simple to play with while finding my way around
const TMP_MODIFY_ASSIGNEE = 'MODIFY_ASSIGNEE';

class AddAssigneesAction implements Action {
  readonly type = ADD_ASSIGNEES;

  constructor(readonly payload: Assignee[]) {
  }
}

class ClearAssigneesAction implements Action {
  readonly type = CLEAR_ASSIGNEES;
}

class TmpModifyAssigneeAction implements Action {
  readonly type = TMP_MODIFY_ASSIGNEE;

  constructor(readonly payload: Assignee) {
  }
}
export interface AssigneeState {
  assignees: Immutable.OrderedMap<string, Assignee>;
}

const initialState = {
  assignees: Immutable.OrderedMap<string, Assignee>()
};

export function reducer(state: AssigneeState = initialState, action: Action): AssigneeState {

  switch (action.type) {
    case ADD_ASSIGNEES: {
      const payload: Assignee[] = (<AddAssigneesAction>action).payload;
      let assignees = state.assignees;
      assignees = assignees.withMutations(mutable => {
        for (const assignee of payload) {
          mutable.set(assignee.key, assignee);
        }
      });
      assignees = <Immutable.OrderedMap<string, Assignee>>assignees.sort(
        (valueA, valueB) => valueA.name.toLocaleLowerCase().localeCompare(valueB.name.toLocaleLowerCase()));
      return {
        assignees: assignees
      };
    }
    case CLEAR_ASSIGNEES: {
      return initialState;
    }
    case TMP_MODIFY_ASSIGNEE: {
      const assignee: Assignee = (<TmpModifyAssigneeAction>action).payload;
      const assignees = state.assignees.set(assignee.key, assignee);
      return {
        assignees: assignees
      };
    }
    default:
      return state;
  }
};

const getAssigneesState = (state: AppState) => state.assignees;
const getAssignees = (state: AssigneeState) => state.assignees;
const assigneesSelector = createSelector(getAssigneesState, getAssignees);
const makeAssigneeSelector = (key: string) => createSelector(assigneesSelector, (assignees) => assignees.get(key));

@Injectable()
export class AssigneesService {
  constructor(private store: Store<AppState>) {
  }

  getAssigneesState(): Observable<AssigneeState> {
    return this.store.select(getAssigneesState);
  }

  getAssignees(): Observable<Immutable.OrderedMap<string, Assignee>> {
    return this.store.select(assigneesSelector);
  }

  getAssignee(key: string): Observable<Assignee> {
    // Taken from https://medium.com/@parkerdan/react-reselect-and-redux-b34017f8194c and https://github.com/reactjs/reselect/issues/18
    return this.store.select(makeAssigneeSelector(key));
  }

  addAssignee(assignee: Assignee) {
    this.store.dispatch(new AddAssigneesAction([assignee]));
  }

  addAssignees(...assignees: Assignee[]) {
    this.store.dispatch(new AddAssigneesAction(assignees));
  }

  clearAssignees() {
    this.store.dispatch(new ClearAssigneesAction());
  }

  tmpUpdateAssignee(assignee: Assignee) {
    this.store.dispatch(new TmpModifyAssigneeAction(assignee));
  }

}
