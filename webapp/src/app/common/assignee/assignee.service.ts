import {Action, Store} from '@ngrx/store';
import {Assignee} from './assignee.model';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {AppState} from '../../app-store';
import {createSelector} from 'reselect';

const ADD_ASSIGNEES = 'ADD_ASSIGNEES';
const CLEAR_ASSIGNEES = 'CLEAR_ASSIGNEES';

class AddAssigneesAction implements Action {
  readonly type = ADD_ASSIGNEES;
  constructor (readonly payload: Assignee[]) {
  }
}

class ClearAssigneesAction implements Action {
  readonly type = CLEAR_ASSIGNEES;
}

export interface AssigneeState {
  assignees: Assignee[];
}

const initialState = {
  assignees: []
};

export function reducer(state: AssigneeState = initialState, action: Action): AssigneeState {

  switch (action.type) {
    case ADD_ASSIGNEES: {
      const payload: Assignee[] = (<AddAssigneesAction>action).payload;
      let assignees = state.assignees;
      for (const assignee of payload) {
        assignees = [...assignees, assignee];
      }
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

  getAssignees(): Observable<Assignee[]> {
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


/*
const initialAssignees = Immutable.OrderedMap<string, Assignee>();

export const assignees: ActionReducer<Immutable.OrderedMap<string, Assignee>> =
  (state: Immutable.OrderedMap<string, Assignee> = initialAssignees, action: Action) => {

    switch (action.type) {
      case ADD_ASSIGNEES: {
        const payload: Assignee[] = <Assignee[]>action.payload;
        for (const assignee of payload) {
          state = state.set(assignee.key, assignee);
        }
        state = <Immutable.OrderedMap<string, Assignee>>state.sort(
          (valueA, valueB) => valueA.name.toLocaleLowerCase().localeCompare(valueB.name.toLocaleLowerCase()));
        return state;
      }
      case CLEAR_ASSIGNEES: {
        return state.clear();
      }
      default:
        return state;
    }
  };

@Injectable()
export class AssigneesService {
  constructor(private store: Store<AppStore>) {
  }

  getAssignees(): Observable<Immutable.OrderedMap<string, Assignee>> {
    return this.store.select('assignees');
  }

  addAssignee(assignee: Assignee) {
    this.store.dispatch({type: ADD_ASSIGNEES, payload: [assignee]});
  }

  addAssignees(...assigneesArr: Assignee[]) {
    this.store.dispatch({type: ADD_ASSIGNEES, payload: assigneesArr});
  }

  clearAssignees() {
    this.store.dispatch({type: CLEAR_ASSIGNEES, payload: null});
  }
}
*/
