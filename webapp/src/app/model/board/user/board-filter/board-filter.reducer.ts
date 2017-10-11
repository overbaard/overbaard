import {BoardFilterState, BoardFilterUtil} from './board-filter.model';
import {Action} from '@ngrx/store';
import {Map, Set} from 'immutable';
import {Dictionary} from '../../../../common/dictionary';
import {
  ASSIGNEE_ATTRIBUTES,
  COMPONENT_ATTRIBUTES,
  FilterAttributes,
  FIX_VERSION_ATTRIBUTES,
  ISSUE_TYPE_ATTRIBUTES,
  LABEL_ATTRIBUTES, PARALLEL_TASK_ATTRIBUTES,
  PRIORITY_ATTRIBUTES,
  PROJECT_ATTRIBUTES,
} from './board-filter.constants';

const CLEAR_FILTERS = 'CLEAR_FILTERS';
const INITIALISE_FILTERS_FROM_QUERYSTRING = 'INITIALISE_FILTERS_FROM_QUERYSTRING';
const UPDATE_FILTER = 'UPDATE_FILTER';

class ClearFiltersAction implements Action {
  type = CLEAR_FILTERS;
}

class InitialiseFromQueryStringAction implements Action {
  readonly type = INITIALISE_FILTERS_FROM_QUERYSTRING;

  constructor(readonly payload: BoardFilterState) {
  }
}

class UpdateFilterAction implements Action {
  readonly type = UPDATE_FILTER;

  constructor(readonly payload: UpdateFilterPayload) {
  }
}


export class BoardFilterActions {
  static createClearFilters() {
    return new ClearFiltersAction();
  }

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
      customField: this.parseCustomFieldFilters(queryParams),
      parallelTask: this.parseParallelTaskFilters(queryParams)
    };
    return new InitialiseFromQueryStringAction(payload);
  }

  static createUpdateFilter(filter: FilterAttributes, data: Object) {
    return new UpdateFilterAction({filter: filter, data: data});
  }

  private static parseCustomFieldFilters(queryParams: Dictionary<string>): Map<string, Set<string>> {
    return this.parsePrefixedMapFilters('cf.', queryParams);
  }

  private static parseParallelTaskFilters(queryParams: Dictionary<string>): Map<string, Set<string>> {
    return this.parsePrefixedMapFilters('pt.', queryParams);
  }

  private static parsePrefixedMapFilters(prefix: string, queryParams: Dictionary<string>): Map<string, Set<string>> {
    return Map<string, Set<string>>().withMutations(mutable => {
      for (const key of Object.keys(queryParams)) {
        if (key.startsWith(prefix)) {
          const name: string = decodeURIComponent(key.substr(prefix.length));
          mutable.set(name, this.parseBooleanFilter(queryParams, key));
        }
      }
    });
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
    case CLEAR_FILTERS: {
      return null;
    }
    case INITIALISE_FILTERS_FROM_QUERYSTRING: {
      const payload: BoardFilterState = (<InitialiseFromQueryStringAction>action).payload;
      return BoardFilterUtil.fromObject(payload);
    }
    case UPDATE_FILTER: {
      const payload: UpdateFilterPayload = (<UpdateFilterAction>action).payload;
      return BoardFilterUtil.toStateRecord(state).withMutations(mutable => {
        if (payload.filter.customField) {
          mutable.customField = mutable.customField.set(payload.filter.key, createSelectedFieldsSet(payload.data));
          return;
        }
        switch (payload.filter) {
          case PROJECT_ATTRIBUTES: {
            mutable.project = createSelectedFieldsSet(payload.data)
            break;
          }
          case ISSUE_TYPE_ATTRIBUTES: {
            mutable.issueType = createSelectedFieldsSet(payload.data)
            break;
          }
          case PRIORITY_ATTRIBUTES: {
            mutable.priority = createSelectedFieldsSet(payload.data)
            break;
          }
          case ASSIGNEE_ATTRIBUTES: {
            mutable.assignee = createSelectedFieldsSet(payload.data)
            break;
          }
          case COMPONENT_ATTRIBUTES: {
            mutable.component = createSelectedFieldsSet(payload.data)
            break;
          }
          case LABEL_ATTRIBUTES: {
            mutable.label = createSelectedFieldsSet(payload.data)
            break;
          }
          case FIX_VERSION_ATTRIBUTES: {
            mutable.fixVersion = createSelectedFieldsSet(payload.data)
            break;
          }
          case PARALLEL_TASK_ATTRIBUTES: {
            mutable.parallelTask = Map<string, Set<string>>().withMutations(ptMutable => {
              for (const key of Object.keys(payload.data)) {
                ptMutable.set(key, createSelectedFieldsSet(payload.data[key]));
              }
            });
            break;
          }
        }
      });
    }
  }
  return state;
}

function createSelectedFieldsSet(object: Object): Set<string> {
  return Set<string>().withMutations(mutable => {
    for (const key of Object.keys(object)) {
      if (object[key]) {
        mutable.add(key);
      }
    }
  });
}

interface UpdateFilterPayload {
  filter: FilterAttributes;
  data: Object;
}
