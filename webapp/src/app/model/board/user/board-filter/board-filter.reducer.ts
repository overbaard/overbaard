import {BoardFilterState, BoardFilterUtil, initialBoardFilterState} from './board-filter.model';
import {Action} from '@ngrx/store';
import {Map, Set} from 'immutable';
import {
  ASSIGNEE_ATTRIBUTES,
  COMPONENT_ATTRIBUTES,
  FilterAttributes,
  FIX_VERSION_ATTRIBUTES,
  ISSUE_TYPE_ATTRIBUTES,
  LABEL_ATTRIBUTES,
  PARALLEL_TASK_ATTRIBUTES,
  PRIORITY_ATTRIBUTES,
  PROJECT_ATTRIBUTES,
} from './board-filter.constants';
import {
  INITIALISE_SETTINGS_FROM_QUERYSTRING,
  InitialiseFromQueryStringAction
} from '../initialise-from-querystring.action';
import {AppState} from '../../../../app-store';
import {UserSettingState} from '../user-setting';

const UPDATE_FILTER = 'UPDATE_FILTER';


class UpdateFilterAction implements Action {
  readonly type = UPDATE_FILTER;

  constructor(readonly payload: UpdateFilterPayload) {
  }
}


export class BoardFilterActions {

  static createUpdateFilter(filter: FilterAttributes, data: Object) {
    return new UpdateFilterAction({filter: filter, data: data});
  }
}


// 'meta-reducer here means it is not called directly by the store, rather from the userSettingReducer
export function boardFilterMetaReducer(state: BoardFilterState = initialBoardFilterState, action: Action): BoardFilterState {
  switch (action.type) {
    case INITIALISE_SETTINGS_FROM_QUERYSTRING: {
      const qsAction: InitialiseFromQueryStringAction = <InitialiseFromQueryStringAction>action;
      const filters: BoardFilterState = {
        project: qsAction.parseBooleanFilter('project'),
        priority: qsAction.parseBooleanFilter('priority'),
        issueType: qsAction.parseBooleanFilter('issue-type'),
        assignee: qsAction.parseBooleanFilter('assignee'),
        component: qsAction.parseBooleanFilter('component'),
        label: qsAction.parseBooleanFilter('label'),
        fixVersion: qsAction.parseBooleanFilter('fix-version'),
        customField: qsAction.parseCustomFieldFilters(),
        parallelTask: qsAction.parseParallelTaskFilters()
      }
      for (const key of Object.keys(filters)) {
        if (filters[key].size > 0) {
          return BoardFilterUtil.fromObject(filters);
        }
      }
      return state;
    }
    case UPDATE_FILTER: {
      const payload: UpdateFilterPayload = (<UpdateFilterAction>action).payload;
      return BoardFilterUtil.updateBoardFilterState(state, mutable => {
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

const getUserSettingState = (state: AppState) => state.userSettings;
const getFilters = (state: UserSettingState) => state.filters;
