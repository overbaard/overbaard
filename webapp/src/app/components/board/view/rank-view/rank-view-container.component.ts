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

  readonly viewMode = BoardViewMode.RANK;

  // Just an array here to be able to do 'for s of states; let i = index' in the entry template
  @Input()
  statesDummyArray: number[];

  private _destroy$: Subject<void> = new Subject<void>();

  private _splitter: ScrollHeightSplitter<RankViewEntry> = ScrollHeightSplitter.create(rve => rve.calculatedTotalHeight);
  private _lastScrollInfo: VirtualScrollInfo = {start: 0, end: 0, beforePadding: 0, afterPadding: 0};
  private _scrollTop = 0;
  visibleEntries: List<RankViewEntry>;
  beforePadding = 0;
  afterPadding = 0;

  constructor(private _zone: NgZone, private _changeDetectorRef: ChangeDetectorRef) {
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
    const scrollInfo: VirtualScrollInfo = this._splitter.getVirtualScrollInfo(this._scrollTop, this.boardBodyHeight);
    if (!forceUpdate) {
      if (this.same(this._lastScrollInfo, scrollInfo)) {
        return;
      }
    }
    this._lastScrollInfo = scrollInfo;

    let visibleEntries: List<RankViewEntry>;
    if (scrollInfo.start === -1) {
      visibleEntries = List<RankViewEntry>();
    } else {
      visibleEntries = <List<RankViewEntry>>this.rankEntries.slice(scrollInfo.start, scrollInfo.end + 1);
    }

    this._zone.run(() => {
      this.visibleEntries = visibleEntries;
      this.beforePadding = scrollInfo.beforePadding;
      this.afterPadding = scrollInfo.afterPadding;
      this._changeDetectorRef.markForCheck();
    });
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }

  same(a: VirtualScrollInfo, b: VirtualScrollInfo) {
    return a.start === b.start &&
      a.end === b.end &&
      a.beforePadding === b.beforePadding &&
      a.afterPadding === b.afterPadding;
  }
}

