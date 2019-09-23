import {Action, createSelector} from '@ngrx/store';
import {Dictionary} from '../../../common/dictionary';
import {List, Map} from 'immutable';
import {initialUserSettingState, UserSettingUtil} from './user-setting.model';
import {boardFilterMetaReducer} from './board-filter/board-filter.reducer';
import {BoardHeader} from '../../../view-model/board/board-header';
import {INITIALISE_SETTINGS_FROM_QUERYSTRING, InitialiseFromQueryStringAction} from './initialise-from-querystring.action';
import {UserSettingState} from './user-setting';
import {AppState} from '../../../app-store';
import {BoardViewMode} from './board-view-mode';
import {IssueSummaryLevel, toIssueSummaryLevel} from './issue-summary-level';
import {IssueDetailUtil} from './issue-detail/issue-detail.model';
import {boardSearchFilterMetaReducer} from './board-filter/board-search-filter.reducer';

const CLEAR_SETTINGS = 'CLEAR_SETTINGS';

const UPDATE_SWIMLANE = 'UPDATE_SWIMLANE';
const TOGGLE_COLUMN_VISIBILITY = 'TOGGLE_COLUMN_VISIBILITY';
const TOGGLE_BACKLOG = 'TOGGLE_HIDE_BACKLOG';
const TOGGLE_SHOW_EMPTY_SWIMLANES = 'TOGGLE_SHOW_EMPTY_SWIMLANES';
const TOGGLE_COLLAPSED_SWIMLANE = 'TOGGLE_COLLAPSED_SWIMLANE';
const SWITCH_BOARD_VIEW = 'SWITCH_BOARD_VIEW';
const UPDATE_ISSUE_DETAIL_LEVEL = 'UPDATE_ISSUE_DETAIL_LEVEL';
const UPDATE_SHOW_PARALLEL_TASKS = 'UPDATE_SHOW_PARALLEL_TASKS';
const UPDATE_SHOW_LINKED_ISSUES = 'UPDATE_SHOW_LINKED_ISSUES';
const UPDATE_SHOW_RANKING_ORDER = 'UPDATE_SHOW_RANKING-ORDER';
const SET_BACKLOG_STATES = 'SET_BACKLOG_STATES';


class ClearSettingsAction implements Action {
  readonly type = CLEAR_SETTINGS;
}


class UpdateSwimlaneAction implements Action {
  readonly type = UPDATE_SWIMLANE;
  constructor(readonly payload: string) {
  }
}

class ToggleVisibilityAction implements Action {
  readonly type = TOGGLE_COLUMN_VISIBILITY;
  constructor(readonly payload: ToggleVisibilityPayload) {
  }
}

class ToggleBacklogAction implements Action {
  readonly type = TOGGLE_BACKLOG;
  constructor(readonly payload: BoardHeader) {
  }
}

class ToggleShowEmptySwimlanesAction implements Action {
  readonly type = TOGGLE_SHOW_EMPTY_SWIMLANES;

}

class ToggleCollapsedSwimlaneAction {
  readonly type = TOGGLE_COLLAPSED_SWIMLANE;
  constructor(readonly payload: string) {
  }
}

class SwitchBoardViewAction {
  readonly type = SWITCH_BOARD_VIEW;
  constructor() {
  }
}

class UpdateIssueSummaryLevelAction {
  readonly type = UPDATE_ISSUE_DETAIL_LEVEL;
  constructor(readonly payload: IssueSummaryLevel) {
  }
}

class UpdateShowParallelTasksAction {
  readonly type = UPDATE_SHOW_PARALLEL_TASKS;
  constructor(readonly payload: boolean) {
  }
}

class UpdateShowLinkedIssuesAction {
  readonly type = UPDATE_SHOW_LINKED_ISSUES;
  constructor(readonly payload: boolean) {
  }
}

class UpdateShowRankingOrderAction {
  readonly type = UPDATE_SHOW_RANKING_ORDER;
  constructor(readonly payload: boolean) {
  }
}

class SetBacklogStatesAction {
  readonly type = SET_BACKLOG_STATES;
  constructor(readonly payload: number) {
  }
}

export class UserSettingActions {
  static createClearSettings(): Action {
    return new ClearSettingsAction();
  }

  static createInitialiseFromQueryString(queryParams: Dictionary<string>): Action {
    return new InitialiseFromQueryStringAction(queryParams);
  }

  static createUpdateSwimlane(swimlane: string): Action {
    return new UpdateSwimlaneAction(swimlane);
  }

  static createToggleBacklog(backlogHeader: BoardHeader): Action {
    return new ToggleBacklogAction(backlogHeader);
  }

  static createToggleVisibility(newValue: boolean, states: List<number>): Action {
    return new ToggleVisibilityAction({newValue: newValue, states: states});
  }

  static createToggleShowEmptySwimlanes(): Action {
    return new ToggleShowEmptySwimlanesAction();
  }

  static createToggleCollapsedSwimlane(key: string): Action {
    return new ToggleCollapsedSwimlaneAction(key);
  }

  static createSwitchBoardViewAction(): Action {
    return new SwitchBoardViewAction();
  }

  static createUpdateIssueSummaryLevel(level: IssueSummaryLevel): Action {
    return new UpdateIssueSummaryLevelAction(level);
  }

  static createUpdateShowParallelTasks(show: boolean): Action {
    return new UpdateShowParallelTasksAction(show);
  }

  static createUpdateShowLinkedIssues(show: boolean) {
    return new UpdateShowLinkedIssuesAction(show);
  }

  static createUpdateShowRankingOrder(show: boolean) {
    return new UpdateShowRankingOrderAction(show);
  }

  static createSetBacklogStates(backlogStates: number) {
    return new SetBacklogStatesAction(backlogStates);
  }
}

export function userSettingReducer(state: UserSettingState = initialUserSettingState, action: Action): UserSettingState {
  switch (action.type) {
    case INITIALISE_SETTINGS_FROM_QUERYSTRING: {
      const initAction: InitialiseFromQueryStringAction = <InitialiseFromQueryStringAction>action;
      const params: Dictionary<string> = initAction.payload;
      return UserSettingUtil.updateUserSettingState(state, mutable => {
        mutable.boardCode = decodeURIComponent(params['board']);
        if (params['view'] === 'rv') {
          mutable.viewMode = BoardViewMode.RANK;
          mutable.forceBacklog = true;
          mutable.showBacklog = true;
        }
        mutable.showBacklog = params['bl'] === 'true' || mutable.viewMode === BoardViewMode.RANK;
        mutable.filters = boardFilterMetaReducer(state.filters, action);
        mutable.searchFilters = boardSearchFilterMetaReducer(state.searchFilters, action);
        mutable.defaultColumnVisibility = initAction.getVisibleColumnDefault();
        mutable.columnVisibilities = initAction.parseVisibleColumns();
          mutable.issueDetail = IssueDetailUtil.updateIssueDetailState(mutable.issueDetail, issueDetail => {
            if (params['isl']) {
              issueDetail.issueSummaryLevel = toIssueSummaryLevel(Number(params['isl']));
            }
            issueDetail.parallelTasks = !(params['vpt'] === 'false');
            issueDetail.linkedIssues = !(params['vli'] === 'false');
            issueDetail.rankingOrder = (params['vro'] === 'true');
          });
        mutable.swimlane = params['swimlane'];
        if (mutable.swimlane) {
          mutable.swimlaneShowEmpty = params['showEmptySl'] === 'true';
          mutable.defaultCollapsedSwimlane = initAction.getSwimlaneCollapsedDefault();
          mutable.collapsedSwimlanes = initAction.parseCollapsedSwimlanes();
        }
      });
    }
    case CLEAR_SETTINGS: {
      return initialUserSettingState;
    }
    case UPDATE_SWIMLANE: {
      return UserSettingUtil.updateUserSettingState(state, mutable => {
        const usa: UpdateSwimlaneAction = <UpdateSwimlaneAction>action;
        if (mutable.swimlane !== usa.payload) {
          mutable.swimlane = usa.payload;
          mutable.swimlaneShowEmpty = false;
          mutable.defaultCollapsedSwimlane = false;
          mutable.collapsedSwimlanes = Map<string, boolean>();
        }
      });
    }
    case TOGGLE_BACKLOG: {
      const backlogHeader: BoardHeader = (<ToggleBacklogAction>action).payload;
      return UserSettingUtil.updateUserSettingState(state, settingState => {
        const newValue: boolean = !settingState.showBacklog;
        settingState.showBacklog = newValue;
        settingState.columnVisibilities = settingState.columnVisibilities.withMutations(visibilities => {
          backlogHeader.stateIndices.forEach(stateIndex => {
            if (settingState.showBacklog) {
              setVisibleState(visibilities, settingState.defaultColumnVisibility, stateIndex, true);
            } else {
              visibilities.remove(stateIndex);
            }
          });
        });
      });
    }
    case TOGGLE_COLUMN_VISIBILITY: {
      const payload: ToggleVisibilityPayload = (<ToggleVisibilityAction>action).payload;
      return UserSettingUtil.updateUserSettingState(state, settingState => {
        settingState.columnVisibilities = settingState.columnVisibilities.withMutations(visibilities => {
          payload.states.forEach(stateIndex => {
            visibilities.set(stateIndex, payload.newValue);
          });
        });
      });
    }
    case TOGGLE_SHOW_EMPTY_SWIMLANES: {
      if (state.swimlane) {
        return UserSettingUtil.updateUserSettingState(state, settingState => {
          settingState.swimlaneShowEmpty = !settingState.swimlaneShowEmpty;
        });
      }
      return state;
    }
    case TOGGLE_COLLAPSED_SWIMLANE: {
      if (state.swimlane) {
        return UserSettingUtil.updateUserSettingState(state, settingState => {
          const key: string = (<ToggleCollapsedSwimlaneAction>action).payload;
          const existingValue = settingState.collapsedSwimlanes.get(key, settingState.defaultCollapsedSwimlane);
          settingState.collapsedSwimlanes = settingState.collapsedSwimlanes.set(key, !existingValue);
        });
      }
      return state;
    }
    case SWITCH_BOARD_VIEW: {
      return UserSettingUtil.updateUserSettingState(state, settingState => {
        if (settingState.viewMode === BoardViewMode.KANBAN) {
          settingState.viewMode = BoardViewMode.RANK;
          if (!settingState.showBacklog) {
            settingState.showBacklog = true;
            settingState.forceBacklog = true;
          }
        } else if (settingState.viewMode === BoardViewMode.RANK) {
          settingState.viewMode = BoardViewMode.KANBAN;
          if (settingState.forceBacklog) {
            settingState.showBacklog = false;
            settingState.forceBacklog = false;
            settingState.columnVisibilities = settingState.columnVisibilities.withMutations(visibilities => {
              for (let stateIndex = 0; stateIndex < settingState.backlogStates; stateIndex++) {
                setVisibleState(visibilities, settingState.defaultColumnVisibility, stateIndex, false);
              }
            });
          }
        }
      });
    }
    case UPDATE_ISSUE_DETAIL_LEVEL: {
      const newLevel: IssueSummaryLevel = (<UpdateIssueSummaryLevelAction>action).payload;
      return UserSettingUtil.updateUserSettingState(state, settingState => {
        settingState.issueDetail = IssueDetailUtil.updateIssueDetailState(settingState.issueDetail, issueDetail => {
          issueDetail.issueSummaryLevel = newLevel;
        });
      });
    }
    case UPDATE_SHOW_PARALLEL_TASKS: {
      const show: boolean = (<UpdateShowParallelTasksAction>action).payload;
      return UserSettingUtil.updateUserSettingState(state, settingState => {
        settingState.issueDetail = IssueDetailUtil.updateIssueDetailState(settingState.issueDetail, issueDetail => {
          issueDetail.parallelTasks = show;
        });
      });
    }
    case UPDATE_SHOW_LINKED_ISSUES: {
      const show: boolean = (<UpdateShowLinkedIssuesAction>action).payload;
      return UserSettingUtil.updateUserSettingState(state, settingState => {
        settingState.issueDetail = IssueDetailUtil.updateIssueDetailState(settingState.issueDetail, issueDetail => {
          issueDetail.linkedIssues = show;
        });
      });
    }
    case UPDATE_SHOW_RANKING_ORDER: {
      const show: boolean = (<UpdateShowRankingOrderAction>action).payload;
      return UserSettingUtil.updateUserSettingState(state, settingState => {
        settingState.issueDetail = IssueDetailUtil.updateIssueDetailState(settingState.issueDetail, issueDetail => {
          issueDetail.rankingOrder = show;
        });
      });
    }
    case SET_BACKLOG_STATES: {
      const backlogStates: number = (<SetBacklogStatesAction>action).payload;
      return UserSettingUtil.updateUserSettingState(state, settingState => {
        settingState.backlogStates = backlogStates;
      });
    }
  }
  // Delegate other actions like updating the filters
  return UserSettingUtil.updateUserSettingState(state, mutable => {
    mutable.filters = boardFilterMetaReducer(state.filters, action);
    mutable.searchFilters = boardSearchFilterMetaReducer(state.searchFilters, action);
  });
}

function setVisibleState(mutableColumnVisibilities: Map<number, boolean>, defaultVisibility: boolean, stateIndex: number, value: boolean) {
  if (value === defaultVisibility) {
    mutableColumnVisibilities.remove(stateIndex);
  } else {
    mutableColumnVisibilities.set(stateIndex, value);
  }
}

interface ToggleVisibilityPayload {
  newValue: boolean;
  states: List<number>;
}

export const userSettingSelector = (state: AppState) => state.userSettings;
const getShowBacklog = (state: UserSettingState) => state.showBacklog;
export const showBacklogSelector = createSelector(userSettingSelector, getShowBacklog);
