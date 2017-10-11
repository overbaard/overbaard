import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {Dictionary} from '../../common/dictionary';
import {ActivatedRoute} from '@angular/router';
import {AppHeaderService} from '../../services/app-header.service';
import {BoardService} from '../../services/board.service';
import {Store} from '@ngrx/store';
import {AppState} from '../../app-store';
import {BoardActions} from '../../model/board/board.reducer';
import {Observable} from 'rxjs/Observable';
import {BoardState} from '../../model/board/board';
import {BoardFilterActions} from '../../model/board/user/board-filter/board-filter.reducer';
import 'rxjs/add/operator/skipWhile';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/of';
import {BoardFilterState} from '../../model/board/user/board-filter/board-filter.model';
import {Subject} from 'rxjs/Subject';
import {List} from 'immutable';
import {headersSelector} from '../../model/board/header/header.reducer';
import {Header} from '../../model/board/header/header';
import {IssueTableVmService} from '../../view-model/board/issue-table/issue-table-vm.service';
import {IssueTableVm} from '../../view-model/board/issue-table/issue-table-vm';


const VIEW_KANBAN = 'kbv';
export const VIEW_RANK = 'rv';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  providers: [BoardService, IssueTableVmService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardComponent implements OnInit, OnDestroy {

  // TODO move these into the store?
  private boardCode: string;
  view: string = VIEW_KANBAN;
  private _wasBacklogForced = false;

  headers$: Observable<List<List<Header>>>;
  issueTable$: Observable<IssueTableVm>;
  windowHeight: number;
  windowWidth: number;

  showControlPanel = false;


  constructor(
    private _route: ActivatedRoute,
    private _boardService: BoardService,
    private _appHeaderService: AppHeaderService,
    private _store: Store<AppState>,
    private _issueTableVmService: IssueTableVmService) {

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
          this._store.dispatch(
              BoardFilterActions.createInitialiseFromQueryString(this._route.snapshot.queryParams));
        }
      );

    this._store.select<BoardFilterState>('filters')
      .skipWhile(filters => !filters)
      .takeUntil(gotAllData$)
      .subscribe(filters => {
        // Got the filters, emit the event to unsubscribe all takeUntil(gotAllData$)
        gotAllData$.next(true);
        // Unsubscribe from the subject itself
        gotAllData$.unsubscribe();
      });

    this.headers$ = this._store.select(headersSelector);
    this.issueTable$ = this._issueTableVmService.getIssueTableVm();
  }


  ngOnDestroy(): void {
    this._store.dispatch(BoardActions.createClearBoard());
    this._store.dispatch(BoardFilterActions.createClearFilters());
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
