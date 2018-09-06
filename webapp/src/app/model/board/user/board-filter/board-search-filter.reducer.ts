import {Action} from '@ngrx/store';
import {Set} from 'immutable';
import {INITIALISE_SETTINGS_FROM_QUERYSTRING, InitialiseFromQueryStringAction} from '../initialise-from-querystring.action';
import {BoardSearchFilterState, BoardSearchFilterUtil, initialBoardSearchFilterState} from './board-search-filter.model';

const UPDATE_SELECTED_ISSUE_IDS = 'UPDATE_SELECTED_ISSUE_IDS';
const UPDATE_CONTAINING_TEXT = 'UPDATE_CONTAINING_TEXT';
const UPDATE_HIDE_NON_MATCHES = 'UPDATE_HIDE_NON_MATCHES';


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

class UpdateHideNonMatchesAction implements Action {
  readonly type = UPDATE_HIDE_NON_MATCHES;

  constructor(readonly payload: boolean) {
  }
}

export class BoardSearchFilterActions {
  static createUpdateIssueIds(searchIssueIds: Set<string>): Action {
    return new UpdateSelectedIssueIdsAction(searchIssueIds);
  }

  static createUpdateContainingText(text: string): Action {
    return new UpdateContainingTextAction(text);
  }

  static createUpdateHideNonMatches(hide: boolean): Action {
    return new UpdateHideNonMatchesAction(hide);
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
      const hide: boolean = qsAction.payload['s.hide'] ? qsAction.payload['s.hide'] === 'true' : false;
      if (issueIds.size > 0 || containingText.length > 0) {
        const filters: BoardSearchFilterState = {
          issueIds: issueIds,
          containingText: containingText,
          hideNonMatches: hide
        };
        return BoardSearchFilterUtil.fromObject(filters);
      }
      return state;
    }
    case UPDATE_SELECTED_ISSUE_IDS: {
      const usiAction: UpdateSelectedIssueIdsAction = <UpdateSelectedIssueIdsAction>action;
      return BoardSearchFilterUtil.updateBoardSearchFilterState(state, mutable => {
        mutable.issueIds = usiAction.payload ? usiAction.payload : initialBoardSearchFilterState.issueIds;
      });
    }
    case UPDATE_CONTAINING_TEXT: {
      const uctAction: UpdateContainingTextAction = <UpdateContainingTextAction>action;
      return BoardSearchFilterUtil.updateBoardSearchFilterState(state, mutable => {
        mutable.containingText = uctAction.payload ? uctAction.payload : initialBoardSearchFilterState.containingText;
      });
    }
    case UPDATE_HIDE_NON_MATCHES: {
      const uhnmAction: UpdateHideNonMatchesAction = <UpdateHideNonMatchesAction>action;
      return BoardSearchFilterUtil.updateBoardSearchFilterState(state, mutable => {
        mutable.hideNonMatches = uhnmAction.payload;
      });
    }
  }
  return state;
}
