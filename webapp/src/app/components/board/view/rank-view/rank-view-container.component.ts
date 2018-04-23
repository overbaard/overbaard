import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit,
  Output, SimpleChange,
  SimpleChanges
} from '@angular/core';
import {BoardViewMode} from '../../../../model/board/user/board-view-mode';
import {BoardViewModel} from '../../../../view-model/board/board-view';
import {UpdateParallelTaskEvent} from '../../../../events/update-parallel-task.event';
import {IssueSummaryLevel} from '../../../../model/board/user/issue-summary-level';
import {IssueDetailState} from '../../../../model/board/user/issue-detail/issue-detail.model';
import {Observable} from 'rxjs/Observable';
import {RankViewEntry} from '../../../../view-model/board/rank-view-entry';
import {List} from 'immutable';
import {Subject} from 'rxjs/Subject';
import {ScrollHeightSplitter, VirtualScrollInfo, StartAndHeight} from '../../../../common/scroll-height-splitter';
import {BoardIssueView} from '../../../../view-model/board/board-issue-view';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-rank-view-container',
  templateUrl: './rank-view-container.component.html',
  styleUrls: ['./rank-view-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankViewContainerComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  rankEntries: List<RankViewEntry>;

  @Input()
  issueDetailState: IssueDetailState;

  @Input()
  boardBodyHeight: number;

  /**
   * Values emitted here come from the ScrollListenerDirective and are OUTSIDE the angular zone.
   */
  @Input()
  topOffsetObserver$: Observable<number>;

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  readonly viewMode = BoardViewMode.RANK;

  // Just an array here to be able to do 'for s of states; let i = index' in the entry template
  @Input()
  statesDummyArray: number[];

  private _destroy$: Subject<void> = new Subject<void>();

  private _splitter: ScrollHeightSplitter<RankViewEntry> = ScrollHeightSplitter.create(rve => rve.calculatedTotalHeight);
  private _scrollTop = 0;
  visibleEntries: List<RankViewEntry>;
  beforePadding = 0;
  afterPadding = 0;

  constructor(private _zone: NgZone, private _changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.topOffsetObserver$
      .pipe(
        takeUntil(this._destroy$)
      )
      .subscribe(
        value => {
          this._scrollTop = value;
          this.calculateVisibleEntries();
      }
    );
  }

  ngOnDestroy(): void {
    this._destroy$.next(null);
  }

  ngOnChanges(changes: SimpleChanges): void {
    const rankChange: SimpleChange = changes['rankEntries'];
    if (rankChange && rankChange.currentValue !== rankChange.previousValue) {
      this._splitter.updateList(this.rankEntries);
      // Force an update here since the underlying list has changed
      this.calculateVisibleEntries(true);
    }
    const heightChange: SimpleChange = changes['boardBodyHeight'];
    if (heightChange && !heightChange.firstChange && heightChange.currentValue !== heightChange.previousValue) {
      this.calculateVisibleEntries(true);
    }
  }


  private calculateVisibleEntries(forceUpdate: boolean = false) {
    this._splitter.updateVirtualScrollInfo(
      this._scrollTop,
      this.boardBodyHeight,
      forceUpdate,
      (startIndex: number, endIndex: number, beforePadding: number, afterPadding: number) => {
        let visibleEntries: List<RankViewEntry>;
        if (startIndex === -1) {
          visibleEntries = List<RankViewEntry>();
        } else {
          visibleEntries = <List<RankViewEntry>>this.rankEntries.slice(startIndex, endIndex + 1);
        }
        this._zone.run(() => {
          this.visibleEntries = visibleEntries;
          this.beforePadding = beforePadding;
          this.afterPadding = afterPadding;
          this._changeDetectorRef.markForCheck();
        });
      });
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }
}

