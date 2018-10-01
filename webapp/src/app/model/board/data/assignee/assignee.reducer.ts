import {Action, createSelector} from '@ngrx/store';
import {Assignee, AssigneeState, AssigneeUtil, initialAssigneeState} from './assignee.model';
import {AppState} from '../../../../app-store';
import {OrderedMap, Seq, Set} from 'immutable';
import Indexed = Seq.Indexed;

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
      assignees[i] = AssigneeUtil.fromJS(a);
    });
    return assignees;
  }
}



// 'meta-reducer here means it is not called directly by the store, rather from the boardReducer
export function assigneeMetaReducer(state: AssigneeState = initialAssigneeState, action: Action): AssigneeState {

  switch (action.type) {
    case ADD_INITAL_ASSIGNEES:
      // These are already sorted from thr server
      return addAssignees(state, (<AddInitialAssignees>action).payload, true);
    case ADD_ASSIGNEES: {
      return addAssignees(state, (<AddAssigneesAction>action).payload, false);
    }
    default:
      return state;
  }
}

function addAssignees(state: AssigneeState, added: Assignee[], fullRefresh: boolean): AssigneeState {
  let assignees = state.assignees;
  const existingAssigneeKeys: Set<string> = assignees.keySeq().toSet();
  const addedAssigneeKeys: string[] = [];
  assignees = assignees.withMutations(mutable => {
    for (const assignee of added) {
      mutable.set(assignee.key, assignee);
      if (fullRefresh) {
        addedAssigneeKeys.push(assignee.key);
      }
    }
  });

  if (fullRefresh) {
    // If it was full refresh everything is sorted from the server and we do not need to sort
    // However any issues in the existing state need to be removed if they were not in the 'added' array
    const removedAssigneeKeys: string[] = existingAssigneeKeys.subtract(addedAssigneeKeys).toArray();
    if (removedAssigneeKeys.length > 0) {
      assignees = assignees.withMutations(mutable => {
        for (const key of removedAssigneeKeys) {
          mutable.remove(key);
        }
      });
    }
  } else {
    assignees = <OrderedMap<string, Assignee>>assignees.sort(
      (valueA, valueB) => valueA.name.toLocaleLowerCase().localeCompare(valueB.name.toLocaleLowerCase()));
  }

  return AssigneeUtil.withMutations(state, mutable => {
    if (!mutable.assignees.equals(assignees)) {
      mutable.assignees = assignees;
    }
  });
}

const getAssigneesState = (state: AppState) => state.board.assignees;
const getAssignees = (state: AssigneeState) => state.assignees;
export const assigneesSelector = createSelector(getAssigneesState, getAssignees);
