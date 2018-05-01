import {Store} from '@ngrx/store';
import {AppState} from '../app-store';
import {combineLatest} from 'rxjs/observable/combineLatest';
import {boardSelector} from '../model/board/data/board.reducer';
import {userSettingSelector} from '../model/board/user/user-setting.reducer';
import {BoardState} from '../model/board/data/board';
import {UserSettingState} from '../model/board/user/user-setting';
import {initialUserSettingState} from '../model/board/user/user-setting.model';
import {initialBoardState} from '../model/board/data/board.model';
import {List, OrderedSet, Set} from 'immutable';
import {BoardFilterState} from '../model/board/user/board-filter/board-filter.model';
import {BoardViewMode} from '../model/board/user/board-view-mode';
import {Injectable} from '@angular/core';
import {IssueSummaryLevel} from '../model/board/user/issue-summary-level';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class BoardQueryParamsService {
  private _boardViewModelHandler: BoardQueryParamsHandler = new BoardQueryParamsHandler();

  constructor(private _store: Store<AppState>) {
  }

  getQueryParams(): Observable<string> {
    return this._boardViewModelHandler.getBoardViewModel(
      this._store.select(boardSelector),
      this._store.select(userSettingSelector));
  }
}

/**
 * This class is mainly internal for BoardQueryParamsService, and a hook for testing. When used by BoardQueryParamsService,
 * its lifecycle follows that of the service
 */
export class BoardQueryParamsHandler {
  private _lastBoardState: BoardState = initialBoardState;
  private _lastUserSettingState: UserSettingState = initialUserSettingState;

  private _lastQueryString = null;

  getBoardViewModel(boardState$: Observable<BoardState>,
                    userSettingState$: Observable<UserSettingState>): Observable<string> {
    return combineLatest(boardState$, userSettingState$, (boardState, userSettingState) => {
      const oldState: UserSettingState = this._lastUserSettingState;
      this._lastBoardState = boardState;
      this._lastUserSettingState = userSettingState;
      if (userSettingState !== oldState) {
        if (oldState !== initialUserSettingState) {
          const params: List<string> = List<string>().asMutable();
          params.push(`board=${encodeURIComponent(userSettingState.boardCode)}`);
          if (userSettingState.showBacklog) {
            params.push('bl=true');
          }
          if (userSettingState.viewMode === BoardViewMode.RANK) {
            params.push('view=rv');
          }
          if (userSettingState.issueDetail.issueSummaryLevel !== IssueSummaryLevel.FULL) {
            params.push(`isl=${userSettingState.issueDetail.issueSummaryLevel}`);
          }
          if (!userSettingState.issueDetail.parallelTasks) {
            params.push('vpt=false');
          }
          if (!userSettingState.issueDetail.linkedIssues) {
            params.push('vli=false');
          }
          if (userSettingState.swimlane) {
            params.push(`swimlane=${encodeURIComponent(userSettingState.swimlane)}`);
            if (userSettingState.swimlaneShowEmpty) {
              params.push('showEmptySl=true');
            }
            this.appendSwimlaneVisibility(params, boardState, userSettingState);
          }
          this.appendFilters(params, userSettingState);
          this.appendColumnVisibility(params, boardState, userSettingState);
          this._lastQueryString = params.join('&');
        }
      }
      return this._lastQueryString;
    });
  }

  private appendColumnVisibility(params: List<string>, boardState: BoardState, userSettingState: UserSettingState) {


    const visibleSet: OrderedSet<number> = OrderedSet<number>().asMutable();
    const invisibleSet: OrderedSet<number> = OrderedSet<number>().asMutable();
    const numStates: number = boardState.headers.states.size;
    const startIndex: number = userSettingState.showBacklog ? 0 : boardState.headers.backlog;
    for (let i = startIndex ; i < numStates ; i++) {
      // No need for encodeURIComponent() here since we're just working with numbers
      if (userSettingState.columnVisibilities.get(i, userSettingState.defaultColumnVisibility)) {
        visibleSet.add(i);
      } else {
        invisibleSet.add(i);
      }
    }
    if (invisibleSet.size > 0 && visibleSet.size > 0) {
      let name: string;
      let indices: OrderedSet<number>;
      if (visibleSet.size > invisibleSet.size) {
        name = 'hidden';
        indices = invisibleSet;
      }  else {
        name = 'visible';
        indices = visibleSet;
      }
      params.push(`${name}=${indices.join(',')}`);
    }
  }

  private appendSwimlaneVisibility(params: List<string>, boardState: BoardState, userSettingState: UserSettingState) {
    // We don't really have the information here to get this perfect, so let's just try our best for now
    // Later we can try to improve on this
    if (userSettingState.collapsedSwimlanes.size > 0) {
      let name: string;
      let search: boolean;
      if (userSettingState.defaultCollapsedSwimlane) {
        name = 'visible-sl';
        search = false;
      } else {
        name = 'hidden-sl';
        search = true;
      }
      const swimlanes: OrderedSet<string> = OrderedSet<string>().withMutations(mutable => {
        userSettingState.collapsedSwimlanes.forEach((visible: boolean, key: string) => {
          if (visible === search) {
            mutable.add(encodeURIComponent(key));
          }
        });
      });
      if (swimlanes.size > 0) {
        params.push(`${name}=${swimlanes.join(',')}`);
      }
    }
  }

  private appendFilters(params: List<string>, userSettingState: UserSettingState) {
    const filters: BoardFilterState = userSettingState.filters;
    this.appendFilterEntry(params, 'project', filters.project);
    this.appendFilterEntry(params, 'priority', filters.priority);
    this.appendFilterEntry(params, 'issue-type', filters.issueType);
    this.appendFilterEntry(params, 'assignee', filters.assignee);
    this.appendFilterEntry(params, 'component', filters.component);
    this.appendFilterEntry(params, 'label', filters.label);
    this.appendFilterEntry(params, 'fix-version', filters.fixVersion);
    filters.customField.forEach((set: Set<string>, key: string) => {
      this.appendFilterEntry(params, 'cf.' + encodeURIComponent(key), set);
    });
    filters.parallelTask.forEach((set: Set<string>, key: string) => {
      this.appendFilterEntry(params, 'pt.' + encodeURIComponent(key), set);
    });
  }

  private appendFilterEntry(params: List<string>, name: string, filters: Set<string>) {
    if (filters.size > 0) {
      params.push(`${name}=${filters.map(v => encodeURIComponent(v)).join(',')}`);
    }
  }
}
