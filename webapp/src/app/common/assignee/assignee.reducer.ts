import {Action} from '@ngrx/store';
import {Assignee, AssigneeFactory} from './assignee.model';
import {AppState} from '../../app-store';
import {createSelector} from 'reselect';
import * as Immutable from 'immutable';

const ADD_INITAL_ASSIGNEES = 'ADD_INITIAL_ASSIGNEES';
const ADD_ASSIGNEES = 'ADD_ASSIGNEES';

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

export class AssigneeActions {
  static createAddInitialAssignees(input: any): Action {
    return new AddInitialAssignees(this.deserialize(input));
  }

  static createAddAssignees(input: any): Action {
    return new AddAssigneesAction(this.deserialize(input));
  }

  private static deserialize(input: any) {
    const inputArray: any[] = input ? input : [];
    const assignees = new Array<Assignee>(inputArray.length);
    inputArray.forEach((a, i) => {
      assignees[i] = AssigneeFactory.fromJS(a);
    });
    return assignees;
  }
}


export interface AssigneeState {
  assignees: Immutable.OrderedMap<string, Assignee>;
}

export const initialAssigneeState = {
  assignees: Immutable.OrderedMap<string, Assignee>()
};

export function assigneeReducer(state: AssigneeState = initialAssigneeState, action: Action): AssigneeState {

  switch (action.type) {
    case ADD_INITAL_ASSIGNEES:
      return addAssignees(initialAssigneeState, (<AddInitialAssignees>action).payload);
    case ADD_ASSIGNEES: {
      return addAssignees(state, (<AddAssigneesAction>action).payload);
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

const getAssigneesState = (state: AppState) => state.board.assignees;
const getAssignees = (state: AssigneeState) => state.assignees;
export const assigneesSelector = createSelector(getAssigneesState, getAssignees);
