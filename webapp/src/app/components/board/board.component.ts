import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {Dictionary} from '../../common/dictionary';
import {ActivatedRoute} from '@angular/router';
import {AppHeaderService} from '../../services/app-header.service';
import {BoardService} from '../../services/board.service';
import {Store} from '@ngrx/store';
import {AppState} from '../../app-store';
import {BoardActions} from '../../model/board/data/board.reducer';
import {Observable} from 'rxjs/Observable';
import {BoardState} from '../../model/board/data/board';
import 'rxjs/add/operator/skipWhile';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/of';
import {Subject} from 'rxjs/Subject';
import {UserSettingActions} from '../../model/board/user/user-setting.reducer';
import {BoardViewModelService} from '../../view-model/board/board-view.service';
import {BoardHeader} from '../../view-model/board/board-header';
import {BoardViewModel} from '../../view-model/board/board-view';


const VIEW_KANBAN = 'kbv';
export const VIEW_RANK = 'rv';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  providers: [BoardService, BoardViewModelService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent implements OnInit, OnDestroy {

  // TODO move these into the store?
  private boardCode: string;
  view: string = VIEW_KANBAN;
  private _wasBacklogForced = false;

  board$: Observable<BoardViewModel>;
  windowHeight: number;
  windowWidth: number;

  showControlPanel = false;


  constructor(
    private _route: ActivatedRoute,
    private _boardService: BoardService,
    private _appHeaderService: AppHeaderService,
    private _store: Store<AppState>,
    private boardViewService: BoardViewModelService) {

    this.setWindowSize();

    const queryParams: Dictionary<string> = _route.snapshot.queryParams;
    const code: string = queryParams['board'];
    if (!code) {
      return;
    }
    this.boardCode = code;

    const view = queryParams['view'];
    if (view) {
      this.view = view;
      if (view === VIEW_RANK) {
        this._wasBacklogForced = true;
      }
    }

    let title = `Board ${code}`;
    if (view === VIEW_RANK) {
      title += ' (rank)';
    }
    this._appHeaderService.setTitle(title);

    // TODO push more querystring values into the store
  }

  ngOnInit() {

    // TODO turn on/off progress indicator and log errors

    // Parse the user settings from the query string first
    this._store.dispatch(UserSettingActions.createInitialiseFromQueryString(this._route.snapshot.queryParams));

    const gotAllData$: Subject<boolean> = new Subject<boolean>();

    this._boardService.loadBoardData(this.boardCode, true)
      .takeUntil(gotAllData$)
      .subscribe(
        value => {
          // Initialise the states in the user settings
          const states: any[] = value['states'];
          const backlog: number = value['backlog'] ? value['backlog'] : 0;
          this._store.dispatch(UserSettingActions.createInitialiseStates(states.length, backlog))
          // Deserialize the board
          this._store.dispatch(BoardActions.createDeserializeBoard(value));
        }
      );

    this._store.select<BoardState>('board')
      .skipWhile(board => board.viewId < 0)
      .takeUntil(gotAllData$)
      .subscribe(
        board => {
          // Turn
          gotAllData$.next(true);
        }
      );

    this.board$ = this.boardViewService.getBoardViewModel();
  }


  ngOnDestroy(): void {
    this._store.dispatch(BoardActions.createClearBoard());
    this._store.dispatch(UserSettingActions.createClearSettings());
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
    this._store.dispatch(UserSettingActions.toggleBacklog(backlogHeader));
  }

  onToggleVisibility(header: BoardHeader) {
    // A decision about whether to pass up toggleVisibility or toggleBacklog is made in KanbanHeaderGroupComponent
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
    this._store.dispatch(UserSettingActions.toggleVisibility(newValue, header.stateIndices));
  }
}

