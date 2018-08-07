import {Action} from '@ngrx/store';
import {Set} from 'immutable';
import {INITIALISE_SETTINGS_FROM_QUERYSTRING, InitialiseFromQueryStringAction} from '../initialise-from-querystring.action';
import {BoardSearchFilterState, BoardSearchFilterUtil, initialBoardSearchFilterState} from './board-search-filter.model';

const UPDATE_SELECTED_ISSUE_IDS = 'UPDATE_SELECTED_ISSUE_IDS';
const UPDATE_CONTAINING_TEXT = 'UPDATE_CONTAINING_TEXT';


class UpdateSelectedIssueIdsAction implements Action {
  readonly type = UPDATE_SELECTED_ISSUE_IDS;
  constructor(readonly payload: Set<string>) {
  }
}

class UpdateContainingTextAction implements Action {
  readonly type = UPDATE_CONTAINING_TEXT;
  constructor(readonly payload: string) {
  }
}

export class BoardSearchFilterActions {
  static createUpdateSearchIssueIds(searchIssueIds: Set<string>): Action {
    return new UpdateSelectedIssueIdsAction(searchIssueIds);
  }

  static createContainingText(text: string): Action {
    return new UpdateContainingTextAction(text);
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
    case UPDATE_CONTAINING_TEXT: {
      const uctAction: UpdateContainingTextAction = <UpdateContainingTextAction>action;
      return BoardSearchFilterUtil.updateBoardSearcgFilterState(state, mutable => {
        mutable.containingText = uctAction.payload;
      });
    }
  }
  return state;
}
