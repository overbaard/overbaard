import {Action, Store} from '@ngrx/store';
import {Assignee} from './assignee.model';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {AppState} from '../../app-store';
import {createSelector} from 'reselect';
import * as Immutable from 'immutable';

const ADD_ASSIGNEES = 'ADD_ASSIGNEES';
const CLEAR_ASSIGNEES = 'CLEAR_ASSIGNEES';

class AddAssigneesAction implements Action {
  readonly type = ADD_ASSIGNEES;

  constructor(readonly payload: Assignee[]) {
  }
}

class ClearAssigneesAction implements Action {
  readonly type = CLEAR_ASSIGNEES;
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
    default:
      return state;
  }
};

const getAssigneesState = (state: AppState) => state.assignees;
const getAssignees = (state: AssigneeState) => state.assignees;
const assigneesSelector = createSelector(getAssigneesState, getAssignees);

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

  addAssignee(assignee: Assignee) {
    this.store.dispatch(new AddAssigneesAction([assignee]));
  }

  addAssignees(...assignees: Assignee[]) {
    this.store.dispatch(new AddAssigneesAction(assignees));
  }

  clearAssignees() {
    this.store.dispatch(new ClearAssigneesAction());
  }
}
