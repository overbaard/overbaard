import {BoardFilterState, BoardFilterUtil, initialBoardFilterState} from './board-filter.model';
import {Action} from '@ngrx/store';
import {Set, Map} from 'immutable';
import {Dictionary} from '../../../utils/dictionary';
import {AppState} from '../../../../app-store';
import {createSelector} from 'reselect';

const INITIALISE_FILTERS_FROM_QUERYSTRING = 'INITIALISE_FILTERS_FROM_QUERYSTRING';

class InitialiseFromQueryStringAction implements Action {
  readonly type = INITIALISE_FILTERS_FROM_QUERYSTRING;

  constructor(readonly payload: BoardFilterState) {
  }
}


export class BoardFilterActions {
  static createInitialiseFromQueryString(queryParams: Dictionary<string>): Action {
    const payload: BoardFilterState = {
      project: this.parseBooleanFilter(queryParams, 'project'),
      priority: this.parseBooleanFilter(queryParams, 'priority'),
      issueType: this.parseBooleanFilter(queryParams, 'issue-type'),
      assignee: this.parseBooleanFilter(queryParams, 'assignee'),
      component: this.parseBooleanFilter(queryParams, 'component'),
      label: this.parseBooleanFilter(queryParams, 'label'),
      fixVersion: this.parseBooleanFilter(queryParams, 'fix-version'),
      // TODO parallel tasks and custom fields
      customField: Map<string, Set<string>>(),
      parallelTask: Map<string, Set<string>>()
    };
    return new InitialiseFromQueryStringAction(payload);
  }

  private static parseBooleanFilter(queryParams: Dictionary<string>, name: string): Set<string> {
    const valueString: string = queryParams[name];
    const set: Set<string> = Set<string>();
    if (valueString) {
      return set.withMutations(mutable => {
        const values: string[] = valueString.split(',');
        for (const value of values) {
          const decoded = decodeURIComponent(value);
          mutable.add(decoded);
        }
      });
    }
    return set;
  }
}


export function boardFilterReducer(state: BoardFilterState, action: Action): BoardFilterState {
  switch (action.type) {
    case INITIALISE_FILTERS_FROM_QUERYSTRING: {
      const payload: BoardFilterState = (<InitialiseFromQueryStringAction>action).payload;
      return BoardFilterUtil.fromObject(payload);
    }
  }
  return state;
}

