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
  static createUpdateIssueIds(searchIssueIds: Set<string>): Action {
    return new UpdateSelectedIssueIdsAction(searchIssueIds);
  }

  static createUpdateContainingText(text: string): Action {
    return new UpdateContainingTextAction(text);
  }
}


// 'meta-reducer here means it is not called directly by the store, rather from the userSettingReducer
export function boardSearchFilterMetaReducer(
  state: BoardSearchFilterState = initialBoardSearchFilterState, action: Action): BoardSearchFilterState {
  switch (action.type) {
    case INITIALISE_SETTINGS_FROM_QUERYSTRING: {
      const qsAction: InitialiseFromQueryStringAction = <InitialiseFromQueryStringAction>action;
      const issueIds: Set<string> = qsAction.parseBooleanFilter('s.ids');
      const containingText: string = qsAction.payload['s.text'] ? decodeURIComponent(qsAction.payload['s.text']) : '';
      if (issueIds.size > 0 || containingText.length > 0) {
        const filters: BoardSearchFilterState = {
          issueIds: issueIds,
          containingText: containingText
        };
        return BoardSearchFilterUtil.fromObject(filters);
      }
      return state;
    }
    case UPDATE_SELECTED_ISSUE_IDS: {
      const usiAction: UpdateSelectedIssueIdsAction = <UpdateSelectedIssueIdsAction>action;
      return BoardSearchFilterUtil.updateBoardSearcgFilterState(state, mutable => {
        mutable.issueIds = usiAction.payload ? usiAction.payload : initialBoardSearchFilterState.issueIds;
      });
    }
    case UPDATE_CONTAINING_TEXT: {
      const uctAction: UpdateContainingTextAction = <UpdateContainingTextAction>action;
      return BoardSearchFilterUtil.updateBoardSearcgFilterState(state, mutable => {
        mutable.containingText = uctAction.payload ? uctAction.payload : initialBoardSearchFilterState.containingText;
      });
    }
  }
  return state;
}
