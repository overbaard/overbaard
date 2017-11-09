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
import {List} from 'immutable';
import {headersSelector} from '../../model/board/data/header/header.reducer';
import {Header} from '../../model/board/data/header/header';
import {BoardViewModelService} from '../../view-model/board/issue-table/board-view-model.service';
import {IssueTable} from '../../view-model/board/issue-table/issue-table';
import {UserSettingActions} from '../../model/board/user/user-setting.reducer';
import {initialHeadersView} from '../../view-model/board/issue-table/headers-view.model';
import {HeadersView} from '../../view-model/board/issue-table/headers-view';


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

  headers$: Observable<HeadersView>;
  issueTable$: Observable<IssueTable>;
  windowHeight: number;
  windowWidth: number;

  showControlPanel = false;


  constructor(
    private _route: ActivatedRoute,
    private _boardService: BoardService,
    private _appHeaderService: AppHeaderService,
    private _store: Store<AppState>,
    private _issueTableVmService: BoardViewModelService) {

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

    // TODO use backlog from querystring (store in the state)
    // TODO turn on/off progress indicator and log errors

    // Parse the user settings from the query string first
    this._store.dispatch(UserSettingActions.createInitialiseFromQueryString(this._route.snapshot.queryParams));

    const gotAllData$: Subject<boolean> = new Subject<boolean>();

    this._boardService.loadBoardData(this.boardCode, true)
      .takeUntil(gotAllData$)
      .subscribe(
        value => {
          // Deserialize the board
          this._store.dispatch(BoardActions.createDeserializeBoard(value));
        }
      );

    this._store.select<BoardState>('board')
      .skipWhile(board => board.viewId < 0)
      .takeUntil(gotAllData$)
      .subscribe(
        board => {
          // Parse the filters once we have the board
          gotAllData$.next(true);
        }
      );

    this.issueTable$ = this._issueTableVmService.getIssueTable();
    this.headers$ = this._issueTableVmService.getHeaders(this.issueTable$);

    // Temp code - REMOVE THIS
    this._issueTableVmService.getHeaders(this.issueTable$)
      .skipWhile(headersView => headersView === initialHeadersView)
      .subscribe(
        headersView => {
          console.log('Headers are: ' + headersView.headers.toString());
          console.log('States are: ' + headersView.states.toArray());
        }
      );
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
}
