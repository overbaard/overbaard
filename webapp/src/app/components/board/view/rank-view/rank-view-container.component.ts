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
import {ScrollHeightSplitter, StartAndEndIndex, StartAndHeight} from '../../../../common/scroll-height-splitter';

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
  topOffsetObserver: Observable<number>;

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  visibleEntries: List<RankViewEntry>;

  readonly viewMode = BoardViewMode.RANK;

  // Just an array here to be able to do 'for s of states; let i = index' in the entry template
  @Input()
  statesDummyArray: number[];

  private _scrollTop = 0;
  beforePadding = 0;
  afterPadding = 0;

  private _destroy$: Subject<void> = new Subject<void>();

  private _splitter: ScrollHeightSplitter<RankViewEntry> = ScrollHeightSplitter.create(rve => rve.calculatedTotalHeight);
  private _lastIndices: StartAndEndIndex = {start: 0, end: 0};

  constructor(private _zome: NgZone, private _changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.topOffsetObserver
      .takeUntil(this._destroy$)
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
      this.calculateVisibleEntries();
    }
  }


  private calculateVisibleEntries(forceUpdate: boolean = false) {
    const indices: StartAndEndIndex = this._splitter.getStartAndEndIndex(this._scrollTop, this.boardBodyHeight);
    if (!forceUpdate) {
      if (this._lastIndices.start === indices.start && this._lastIndices.end === indices.end) {
        return;
      }
    }
    this._lastIndices = indices;

    let visibleEntries: List<RankViewEntry>;
    let beforePadding: number = this.beforePadding;
    let afterPadding: number = this.afterPadding;
    if (indices.start === -1) {
      visibleEntries = List<RankViewEntry>();
    } else {
      visibleEntries = <List<RankViewEntry>>this.rankEntries.slice(indices.start, indices.end + 1);
      const startPositions: List<StartAndHeight> = this._splitter.startPositions;
      beforePadding = startPositions.get(indices.start).start;

      afterPadding = 0;
      if ((startPositions.size - 1) > indices.end) {
        const endStartPos: StartAndHeight = startPositions.get(indices.end);
        const lastStartPos: StartAndHeight = startPositions.get(startPositions.size - 1);
        const last: number = lastStartPos.start + lastStartPos.height;
        const end: number = endStartPos.start + endStartPos.height;
        afterPadding = last - end;
      }
    }

    this._zome.run(() => {
      this.visibleEntries = visibleEntries;
      this.beforePadding = beforePadding;
      this.afterPadding = afterPadding;
      this._changeDetectorRef.markForCheck();
    });
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }
}

