import {ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AppHeaderService} from '../../services/app-header.service';
import {BoardService} from '../../services/board.service';
import {Store} from '@ngrx/store';
import {AppState} from '../../app-store';
import {blacklistSelector, BoardActions} from '../../model/board/data/board.reducer';
import {Observable, Subject} from 'rxjs';
import {UserSettingActions, userSettingSelector} from '../../model/board/user/user-setting.reducer';
import {BoardViewModelService} from '../../view-model/board/board-view.service';
import {BoardHeader} from '../../view-model/board/board-header';
import {BoardViewModel} from '../../view-model/board/board-view';
import {UserSettingState} from '../../model/board/user/user-setting';
import {BoardViewMode} from '../../model/board/user/board-view-mode';
import {BoardQueryParamsService} from '../../services/board-query-params.service';
import {UpdateParallelTaskEvent} from '../../events/update-parallel-task.event';
import {BlacklistState, BlacklistUtil} from '../../model/board/data/blacklist/blacklist.model';
import {ProgressLogActions, progressLogCurrentMessageSelector} from '../../model/global/progress-log/progress-log.reducer';
import {MatDialog} from '@angular/material';
import {BlacklistDialogComponent} from './blacklist/blacklist-dialog.component';
import {filter, take, takeUntil} from 'rxjs/operators';


@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  providers: [BoardService, BoardViewModelService, BoardQueryParamsService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent implements OnInit, OnDestroy {

  viewMode: BoardViewMode = BoardViewMode.KANBAN;

  board$: Observable<BoardViewModel>;
  windowHeight: number;
  windowWidth: number;

  userSettings$: Observable<UserSettingState>;

  private _destroy$: Subject<boolean> = new Subject<boolean>();

  // Expose the enum to the template
  enumViewMode = BoardViewMode;

  openingSettings: boolean;
  settingsOpen: boolean;

  blacklist: BlacklistState;


  private _blacklistMsg: string;

  constructor(
    private _elementRef: ElementRef,
    private _route: ActivatedRoute,
    private _boardService: BoardService,
    private _appHeaderService: AppHeaderService,
    private _store: Store<AppState>,
    private boardViewService: BoardViewModelService,
    private _queryParamsService: BoardQueryParamsService,
    private menuDialog: MatDialog) {

    this.setWindowSize();

  }

  ngOnInit() {
    let userSettings: UserSettingState = null;
    this._store.dispatch(UserSettingActions.createInitialiseFromQueryString(this._route.snapshot.queryParams));
    this._store.select(userSettingSelector)
      .pipe(
        take(1)
      )
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
          this._boardService.loadBoardData(userSettingsValue.boardCode, userSettings.showBacklog, true);

          this._blacklistMsg = 'There are problems in the configuration of board \'' + userSettingsValue.boardCode +
            '\'. Click the red warning icon for details, and let your administrator know.';
        });


    this.board$ = this.boardViewService.getBoardViewModel();
    this.userSettings$ = this._store.select<UserSettingState>(userSettingSelector);

    this._queryParamsService.getQueryParams()
      .pipe(
        takeUntil(this._destroy$)
      )
      .subscribe(queryString => {
        this.updateLink(queryString);
      });

    let shownBlacklstLogMessage = false;
    this._store.select(blacklistSelector)
      .pipe(
        takeUntil(this._destroy$),
        filter((blacklist: BlacklistState) => BlacklistUtil.hasEntries(blacklist))
      )
      .subscribe(
        (blacklist: BlacklistState) => {
          if (!shownBlacklstLogMessage) {
            shownBlacklstLogMessage = true;
            this._store.dispatch(ProgressLogActions.createLogMessage(this._blacklistMsg, true));
          }
          this.blacklist = blacklist;
        });
  }


  ngOnDestroy(): void {
    this._boardService.destroy();
    this._store.dispatch(BoardActions.createClearBoard());
    this._store.dispatch(UserSettingActions.createClearSettings());
    this._destroy$.next(true);
  }

  onDocumentVisiblityChange(event: Event) {
    // While this is more reliable that onBlur/onFocus it only gets hidden when the window is completely hidden
    // (or another tab is visible)
    this._boardService.visible = !event.target['hidden'];
  }

  onWindowResize(event: Event) {
    this.setWindowSize();
  }

  private setWindowSize() {
    this.windowHeight = window.innerHeight;
    this.windowWidth = window.innerWidth;
  }

  onToggleBacklog(backlogHeader: BoardHeader) {
    // A decision about whether to pass up toggleVisibility or toggleBacklog is made in BoardHeaderGroupComponent
    this._store.dispatch(UserSettingActions.createToggleBacklog(backlogHeader));
    this.userSettings$
      .pipe(
        take(1)
      )
      .subscribe(us => {
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

  onSwitchViewMode() {
    // Update the view
    this.userSettings$
      .pipe(
        take(1)
      )
      .subscribe(originalUs => {
      this._store.dispatch(UserSettingActions.createSwitchBoardViewAction());
      this.userSettings$.pipe(
        take(1)
      )
      .subscribe(us => {
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
    this._boardService.loadBoardData(userSetting.boardCode, userSetting.showBacklog, false);
  }


  onToggleCollapsedSwimlane(key: string) {
    this._store.dispatch(UserSettingActions.createToggleCollapsedSwimlane(key));
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.userSettings$
      .pipe(
        take(1)
      )
      .subscribe(us => {
        this._boardService.setParallelTaskOption(
          us.boardCode, us.showBacklog, event.issueKey, event.taskName,
          event.groupIndex, event.taskIndex, event.optionName, event.selectedOptionIndex);
      });
  }

  onOpenSettings() {
    this.openingSettings = true;
  }

  onCompleteSettingsToggle(open: boolean) {
    this.settingsOpen = open;
    this.openingSettings = false;
  }

  get displaySettingsContent(): boolean {
    // We want the ngIf where this is used to display the settings content while the drawer is opening, not wait until
    // it is opened.
    return this.settingsOpen || this.openingSettings;
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

  onClickBlacklist() {
    this._store.select(progressLogCurrentMessageSelector)
      .pipe(
        take(1)
      )
      .subscribe(
        logEntry => {
          if (logEntry && logEntry.message === this._blacklistMsg) {
            // We have clicked the show blacklist button, so let's dismiss the error message telling us to view it

            // A simple ProgressLogActions.createClearFirstMessage() does not actually dismiss the snackbar message,
            // so do this workaround to be handled by the app component
            this._store.dispatch(ProgressLogActions.createExternallyDismissFirstMessage());
          }
        });
    this.menuDialog.open(BlacklistDialogComponent, {
      data: {
        blacklist: this.blacklist
      }
    });
  }

}

