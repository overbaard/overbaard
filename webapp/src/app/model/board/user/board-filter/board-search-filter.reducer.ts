import {Action} from '@ngrx/store';
import {Set} from 'immutable';
import {FilterAttributes,} from './board-filter.constants';
import {INITIALISE_SETTINGS_FROM_QUERYSTRING, InitialiseFromQueryStringAction} from '../initialise-from-querystring.action';
import {AppState} from '../../../../app-store';
import {UserSettingState} from '../user-setting';
import {BoardSearchFilterState, BoardSearchFilterUtil, initialBoardSearchFilterState} from './board-search-filter.model';

const UPDATE_SELECTED_ISSUE_IDS = 'UPDATE_SELECTED_ISSUE_IDS';


class UpdateSelectedIssueIdsAction {
  readonly type = UPDATE_SELECTED_ISSUE_IDS;
  constructor(readonly payload: Set<string>) {
  }
}



export class BoardSearchFilterActions {
  static createUpdateSearchIssueIds(searchIssueIds: Set<string>) {
    return new UpdateSelectedIssueIdsAction(searchIssueIds);
  }
}


// 'meta-reducer here means it is not called directly by the store, rather from the userSettingReducer
export function boardSearchFilterMetaReducer(
  state: BoardSearchFilterState = initialBoardSearchFilterState, action: Action): BoardSearchFilterState {
  switch (action.type) {
    case INITIALISE_SETTINGS_FROM_QUERYSTRING: {
      const qsAction: InitialiseFromQueryStringAction = <InitialiseFromQueryStringAction>action;
      /*
      const filters: BoardFilterState = {
        project: qsAction.parseBooleanFilter('project'),
        priority: qsAction.parseBooleanFilter('priority'),
        issueType: qsAction.parseBooleanFilter('issue-type'),
        assignee: qsAction.parseBooleanFilter('assignee'),
        component: qsAction.parseBooleanFilter('component'),
        label: qsAction.parseBooleanFilter('label'),
        fixVersion: qsAction.parseBooleanFilter('fix-version'),
        customField: qsAction.parseCustomFieldFilters(),
        parallelTask: qsAction.parseParallelTaskFilters(),
        searchIssueId: Set<string>(),
        searchContainingText: null
      };
      for (const key of Object.keys(filters)) {
        if (filters[key].size > 0) {
          return BoardFilterUtil.fromObject(filters);
        }
      }
      return state;*/
      break; // TODO delete this
    }
    case UPDATE_SELECTED_ISSUE_IDS: {
      const usiAction: UpdateSelectedIssueIdsAction = <UpdateSelectedIssueIdsAction>action;
      return BoardSearchFilterUtil.updateBoardSearcgFilterState(state, mutable => {
        mutable.issueIds = usiAction.payload;
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
