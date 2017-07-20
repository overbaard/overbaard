import * as Immutable from 'immutable';

import {Action, ActionReducer, Store} from '@ngrx/store';
import {Assignee} from './assignee.model';
import {AppStore} from './app-store.model';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs/Observable';

export const ADD_ASSIGNEES = 'ADD_ASSIGNEES';
export const CLEAR_ASSIGNEES = 'CLEAR_ASSIGNEES';

const initialAssignees = new Array<Assignee>();

export function  assignees(state: Assignee[] = initialAssignees, action: Action): Assignee[] {

  switch (action.type) {
    case ADD_ASSIGNEES: {
      const payload: Assignee[] = <Assignee[]>action.payload;
      for (const assignee of payload) {
        state = [...state, assignee];
      }
      return state;
    }
    case CLEAR_ASSIGNEES: {
      return [];
    }
    default:
      return state;
  }
};

@Injectable()
export class AssigneesService {
  constructor(private store: Store<AppStore>) {
  }

  getAssignees(): Observable<Assignee[]> {
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
