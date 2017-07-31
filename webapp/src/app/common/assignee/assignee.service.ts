import {Action, Store} from '@ngrx/store';
import {Assignee, AssigneeFactory} from './assignee.model';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {AppState} from '../../app-store';
import {createSelector} from 'reselect';
import * as Immutable from 'immutable';

const ADD_INITAL_ASSIGNEES = 'ADD_INITIAL_ASSIGNEES';
const ADD_ASSIGNEES = 'ADD_ASSIGNEES';
const CLEAR_ASSIGNEES = 'CLEAR_ASSIGNEES';
// TODO remove this. We should not be modifying assignees, I just want something simple to play with while finding my way around
const TMP_MODIFY_ASSIGNEE = 'MODIFY_ASSIGNEE';


class AddInitialAssignees implements Action {
  readonly type = ADD_INITAL_ASSIGNEES;

  constructor(readonly payload: Assignee[]) {
  }
}

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
    case ADD_INITAL_ASSIGNEES:
      return addAssignees(initialState, (<AddInitialAssignees>action).payload);
    case ADD_ASSIGNEES: {
      return addAssignees(state, (<AddAssigneesAction>action).payload);
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

function addAssignees(state: AssigneeState, added: Assignee[]): AssigneeState {
  let assignees = state.assignees;
  assignees = assignees.withMutations(mutable => {
    for (const assignee of added) {
      mutable.set(assignee.key, assignee);
    }
  });
  assignees = <Immutable.OrderedMap<string, Assignee>>assignees.sort(
    (valueA, valueB) => valueA.name.toLocaleLowerCase().localeCompare(valueB.name.toLocaleLowerCase()));
  return {
    assignees: assignees
  };

}

const getAssigneesState = (state: AppState) => state.assignees;
const getAssignees = (state: AssigneeState) => state.assignees;
export const assigneesSelector = createSelector(getAssigneesState, getAssignees);
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

  // TODO remove this it is just POC
  getAssignee(key: string): Observable<Assignee> {
    // Taken from https://medium.com/@parkerdan/react-reselect-and-redux-b34017f8194c and https://github.com/reactjs/reselect/issues/18
    return this.store.select(makeAssigneeSelector(key));
  }

  /**
   * Call when populating a new board
   *
   * @param input
   */
  deserializeInitialAssignees(input: any) {
    this.store.dispatch(new AddInitialAssignees(this.deserialize(input)));
  }

  /**
   * Call when adding assigness to a board from the server changes
   * @param input
   */
  deserializeAddedAssignees(input: any) {
    this.store.dispatch(new AddAssigneesAction(this.deserialize(input)));
  }

  private deserialize(input: any) {
    const inputArray: any[] = input ? input : [];
    const assignees = new Array<Assignee>(inputArray.length);
    inputArray.forEach((a, i) => {
      assignees[i] = AssigneeFactory.fromJS(a);
    });
    return assignees;
  }

  //
  addAssignees(assignees: Assignee[]) {
    this.store.dispatch(new AddAssigneesAction(assignees));
  }

  clearAssignees() {
    this.store.dispatch(new ClearAssigneesAction());
  }

  // TODO remove this it is just POC
  tmpUpdateAssignee(assignee: Assignee) {
    this.store.dispatch(new TmpModifyAssigneeAction(assignee));
  }

}
