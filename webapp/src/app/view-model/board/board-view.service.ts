import {Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../app-store';
import {initialBoardViewModel} from './board-view.model';
import {combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {BoardState} from '../../model/board/data/board';
import {initialUserSettingState} from '../../model/board/user/user-setting.model';
import {initialBoardState} from '../../model/board/data/board.model';
import {BoardViewModel} from './board-view';
import {UserSettingState} from '../../model/board/user/user-setting';
import {boardSelector} from '../../model/board/data/board.reducer';
import {userSettingSelector} from '../../model/board/user/user-setting.reducer';
import {FontSizeTableService} from '../../services/font-size-table.service';
import {ChangeType} from './view-builder/change-type';
import {BoardViewBuilder} from './view-builder/board-view.builder';
import {UrlService} from '../../services/url.service';

@Injectable()
export class BoardViewModelService {
  private readonly _boardViewModelHandler: BoardViewModelHandler;

  constructor(private _store: Store<AppState>, private _fontSizeTable: FontSizeTableService, urlService: UrlService) {
    this._boardViewModelHandler = new BoardViewModelHandler(this._fontSizeTable, urlService.jiraUrl);
  }

  getBoardViewModel(): Observable<BoardViewModel> {
    return this._boardViewModelHandler.getBoardViewModel(
      this._store.select(boardSelector),
      this._store.select(userSettingSelector));
  }
}

/**
 * This class is mainly internal for _BoardViewModelService, and a hook for testing. When used by BoardViewModelService,
 * its lifecycle follows that of the service
 */
export class BoardViewModelHandler {
  private _lastBoardState: BoardState = initialBoardState;
  private _lastUserSettingState: UserSettingState = initialUserSettingState;

  private _lastBoardView: BoardViewModel = initialBoardViewModel;
  private _forcedRefresh = false;

  constructor(private readonly _fontSizeTable: FontSizeTableService, private _jiraUrl: string) {
  }

  getBoardViewModel(boardState$: Observable<BoardState>,
                    userSettingState$: Observable<UserSettingState>): Observable<BoardViewModel> {

    return combineLatest(boardState$, userSettingState$)
      .pipe(
        map((values: any[], index: number) => {
          const boardState: BoardState = values[0];
          const userSettingState: UserSettingState = values[1];

          if (boardState === initialBoardState || userSettingState === initialUserSettingState) {
            return this._lastBoardView;
          }

          let changeType: ChangeType = null;
          if (boardState !== this._lastBoardState) {
            if (this._forcedRefresh) {
              changeType = ChangeType.UPDATE_BOARD_AFTER_BACKLOG_TOGGLE;
              this._forcedRefresh = false;
            } else {
              if (this._lastBoardState.headers.helpTexts !== boardState.headers.helpTexts) {
                changeType = ChangeType.INIT_HELP_TEXTS;
              } else {
                changeType = this._lastBoardState === initialBoardState ? ChangeType.LOAD_BOARD : ChangeType.UPDATE_BOARD;
              }
            }
          } else if (boardState.viewId >= 0) {
            if (userSettingState.filters !== this._lastUserSettingState.filters) {
              changeType = ChangeType.APPLY_FILTERS;
            } else if (userSettingState.swimlane !== this._lastUserSettingState.swimlane) {
              changeType = ChangeType.CHANGE_SWIMLANE;
            } else if (userSettingState.viewMode !== this._lastUserSettingState.viewMode) {
              if (this._lastUserSettingState.showBacklog !== userSettingState.showBacklog) {
                // Don't do anything for this update. The caller needs to do a full refresh (see comment in BoardComponent).
                this._forcedRefresh = true;
              } else {
                changeType = ChangeType.SWITCH_VIEW_MODE;
              }
            } else if (userSettingState.showBacklog !== this._lastUserSettingState.showBacklog) {
              // Don't do anything. The caller needs to do a full refresh (see comment in BoardComponent).
              this._forcedRefresh = true;
            } else if (userSettingState.columnVisibilities !== this._lastUserSettingState.columnVisibilities) {
              changeType = ChangeType.CHANGE_COLUMN_VISIBILITY;
            } else if (userSettingState.swimlaneShowEmpty !== this._lastUserSettingState.swimlaneShowEmpty) {
              changeType = ChangeType.TOGGLE_SWIMLANE_SHOW_EMPTY;
            } else if (userSettingState.collapsedSwimlanes !== this._lastUserSettingState.collapsedSwimlanes) {
              changeType = ChangeType.TOGGLE_SWIMLANE_COLLAPSED;
            } else if (userSettingState.issueDetail !== this._lastUserSettingState.issueDetail) {
              changeType = ChangeType.UPDATE_ISSUE_DETAIL;
            } else if (userSettingState.searchFilters !== this._lastUserSettingState.searchFilters) {
              if (userSettingState.searchFilters.hideNonMatches ===
                this._lastUserSettingState.searchFilters.hideNonMatches) {
                changeType = ChangeType.UPDATE_SEARCH;
              } else {
                changeType = ChangeType.TOGGLE_HIDE_SEARCH_NON_MATCHES;
              }
            }
          }

          let boardView: BoardViewModel = this._lastBoardView;
          if (changeType != null) {
            boardView = new BoardViewBuilder(this._fontSizeTable, this._jiraUrl, changeType, this._lastBoardView,
              this._lastBoardState, boardState, this._lastUserSettingState, userSettingState)
              .build();
          }

          this._lastBoardState = boardState;
          this._lastUserSettingState = userSettingState;
          this._lastBoardView = boardView;
          return this._lastBoardView;
        })
      );
  }
}










