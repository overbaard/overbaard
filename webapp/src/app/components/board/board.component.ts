import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AppHeaderService} from '../../services/app-header.service';
import {BoardService} from '../../services/board.service';
import {Store} from '@ngrx/store';
import {AppState} from '../../app-store';
import {BoardActions, boardSelector} from '../../model/board/data/board.reducer';
import {Observable} from 'rxjs/Observable';
import {BoardState} from '../../model/board/data/board';
import 'rxjs/add/operator/skipWhile';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/of';
import {Subject} from 'rxjs/Subject';
import {UserSettingActions, userSettingSelector} from '../../model/board/user/user-setting.reducer';
import {BoardViewModelService} from '../../view-model/board/board-view.service';
import {BoardHeader} from '../../view-model/board/board-header';
import {BoardViewModel} from '../../view-model/board/board-view';
import {UserSettingState} from '../../model/board/user/user-setting';
import {BoardViewMode} from '../../model/board/user/board-view-mode';
import {BoardQueryParamsService} from '../../services/board-query-params.service';
import {flatMap} from 'tslint/lib/utils';


@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  providers: [BoardService, BoardViewModelService, BoardQueryParamsService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent implements OnInit, OnDestroy {

  // TODO move these into the store?
  private boardCode: string;
  viewMode: BoardViewMode = BoardViewMode.KANBAN;

  board$: Observable<BoardViewModel>;
  windowHeight: number;
  windowWidth: number;

  userSettings$: Observable<UserSettingState>;
  showControlPanel = false;

  private _destroy$: Subject<boolean> = new Subject<boolean>();

  // Expose the enum to the template
  enumViewMode = BoardViewMode;

  constructor(
    private _route: ActivatedRoute,
    private _boardService: BoardService,
    private _appHeaderService: AppHeaderService,
    private _store: Store<AppState>,
    private boardViewService: BoardViewModelService,
    private _queryParamsService: BoardQueryParamsService) {

    this.setWindowSize();

  }

  ngOnInit() {

    // TODO turn on/off progress indicator and log errors

    // Parse the user settings from the query string first

    const gotAllData$: Subject<boolean> = new Subject<boolean>();

    let userSettings: UserSettingState = null;
    this._store.dispatch(UserSettingActions.createInitialiseFromQueryString(this._route.snapshot.queryParams))
    this._store.select(userSettingSelector)
      .take(1)
      .subscribe(
        userSettingsValue => {
          let title = `Board ${userSettingsValue.boardCode}`;
          if (userSettingsValue.viewMode === BoardViewMode.RANK) {
            title += ' (rank)';
          }
          this._appHeaderService.setTitle(title);
          this.viewMode = userSettingsValue.viewMode;
          userSettings = userSettingsValue;
          // TODO progress and error handling
          this._boardService.loadBoardData(userSettingsValue.boardCode, userSettings.showBacklog)
            .takeUntil(gotAllData$)
            .subscribe(
              boardValue => {
                // Deserialize the board
                this._store.dispatch(BoardActions.createDeserializeBoard(boardValue));
              }
            );
        });


    this._store.select<BoardState>(boardSelector)
      .skipWhile(board => !board || board.viewId < 0)
      .takeUntil(gotAllData$)
      .subscribe(
        board => {
          gotAllData$.next(true);
        }
      );

    this.board$ = this.boardViewService.getBoardViewModel();
    this.userSettings$ = this._store.select<UserSettingState>(userSettingSelector);

    this._queryParamsService.getQueryParams()
      .takeUntil(this._destroy$)
      .subscribe(queryString => {
        this.updateLink(queryString);
      });
  }


  ngOnDestroy(): void {
    this._store.dispatch(BoardActions.createClearBoard());
    this._store.dispatch(UserSettingActions.createClearSettings());
    this._destroy$.next(true);
  }

  onFocus($event: Event) {

  }

  onBlur($event: Event) {

  }

  onResize($event: Event) {
    this.setWindowSize();
  }

  private setWindowSize() {
    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;
  }

  onToggleControlPanel($event: Event) {
    this.showControlPanel = !this.showControlPanel;
  }

  onToggleBacklog(backlogHeader: BoardHeader) {
    // A decision about whether to pass up toggleVisibility or toggleBacklog is made in BoardHeaderGroupComponent
    this._store.dispatch(UserSettingActions.createToggleBacklog(backlogHeader));
    this.userSettings$.take(1).subscribe(us => {
      this.refreshBoardForBacklogToggle(us);
    });
  }

  onToggleVisibility(header: BoardHeader) {
    // A decision about whether to pass up toggleVisibility or toggleBacklog is made in BoardHeaderGroupComponent
    let newValue = true;
    if (header.category) {
      // For a category, if all its states are false, make them all true. Otherwise make them all false.
      header.states.forEach(s => {
        const currentVisibility: boolean = s.visible;
        if (currentVisibility) {
          newValue = false;
          return false;
        }
      });
    } else {
      newValue = !header.visible;
    }
    this._store.dispatch(UserSettingActions.createToggleVisibility(newValue, header.stateIndices));
  }

  onSwitchViewMode(event: Event) {
    // Update the view
    this.userSettings$.take(1).subscribe(originalUs => {
      this._store.dispatch(UserSettingActions.createSwitchBoardViewAction());
      this.userSettings$.take(1).subscribe(us => {
        if (us.showBacklog !== originalUs.showBacklog) {
          this.refreshBoardForBacklogToggle(us);
        }
      });
    });
  }

  private refreshBoardForBacklogToggle(userSetting: UserSettingState) {
    // We need to do a full refresh when toggling the backlog to keep the ranks in order. This is needed whether
    // we show it or hide it.
    // The main reason for this is the list of issue ranks in the board state. This is even needed when hiding it, as
    // if we have the list with the backlog shown and then simply hide locally without doing a full reload, the rank changes we
    // get from the server will be based off the 'no backlog' indices, while we would have the list including the backlog
    // issues
    this._boardService.loadBoardData(userSetting.boardCode, userSetting.showBacklog)
      .take(1)
      .subscribe(
        boardValue => {
          // Deserialize the board
          this._store.dispatch(BoardActions.createDeserializeBoard(boardValue));
        });
  }


  onToggleCollapsedSwimlane(key: string) {
    this._store.dispatch(UserSettingActions.createToggleCollapsedSwimlane(key));
  }

  private updateLink(queryString: string) {
    if (queryString) {
      let url: string = window.location.href;
      const index = url.lastIndexOf('?');
      if (index >= 0) {
        url = url.substr(0, index);
      }
      url = url + '?' + queryString;
      history.replaceState(null, null, url);
    }
  }

}

