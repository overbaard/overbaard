import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges
} from '@angular/core';
import {BoardViewMode} from '../../../../model/board/user/board-view-mode';
import {UpdateParallelTaskEvent} from '../../../../events/update-parallel-task.event';
import {IssueDetailState} from '../../../../model/board/user/issue-detail/issue-detail.model';
import {Observable, Subject} from 'rxjs';
import {RankViewEntry} from '../../../../view-model/board/rank-view-entry';
import {is, List, Map} from 'immutable';
import {takeUntil} from 'rxjs/operators';
import {ScrollHeightSplitter} from '../../../../common/scroll-height-splitter';
import {Dictionary} from '../../../../common/dictionary';
import {BoardIssueView} from '../../../../view-model/board/board-issue-view';
import {BoardHeaders} from '../../../../view-model/board/board-headers';
import {BoardHeader} from '../../../../view-model/board/board-header';

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

  @Input()
  rankOrdersByProject: Map<string, Map<string, number>>;

  @Input()
  flattenedHeaders: List<BoardHeader>;

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  readonly viewMode = BoardViewMode.RANK;

  private _destroy$: Subject<void> = new Subject<void>();

  private _splitter: ScrollHeightSplitter<RankViewEntry> = ScrollHeightSplitter.create(false, 0, rve => rve.calculatedTotalHeight);
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
      requestAnimationFrame(() => {
        this.calculateVisibleEntries(true);
      });
    }
    const heightChange: SimpleChange = changes['boardBodyHeight'];
    if (heightChange && !heightChange.firstChange && heightChange.currentValue !== heightChange.previousValue) {
      requestAnimationFrame(() => {
        this.calculateVisibleEntries();
      });
    }
  }

  private getRankOrder(rankEntry: RankViewEntry): number {
    const issue: BoardIssueView = rankEntry.issue;
    const ranks: Map<string, number> = this.rankOrdersByProject.get(issue.projectCode);
    if (!ranks) {
      return null;
    }
    return ranks.get(issue.key);
  }

  private getTotalIssuesForProject(rankEntry: RankViewEntry): number {
    const ranks: Map<string, number> = this.rankOrdersByProject.get(rankEntry.issue.projectCode);
    if (!ranks) {
      return null;
    }
    return ranks.size;
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

        // console.log(`${startIndex}-${endIndex} ${this.beforePadding}/${this.afterPadding} ` +
        //   `${this.rankEntries.slice(startIndex, endIndex + 1).map(r => r.issue.key).toArray()}`);

        if (NgZone.isInAngularZone()) {
          // When called from ngOnChanges, it will be in the angular zone, otherwise it is not
          this.updateVisibleEntries(visibleEntries, beforePadding, afterPadding);
        } else {
          this._zone.run(() => {
            this.updateVisibleEntries(visibleEntries, beforePadding, afterPadding);
          });
        }
      });
  }

  private updateVisibleEntries(visibleEntries: List<RankViewEntry>, beforePadding: number, afterPadding: number) {
    this.visibleEntries = visibleEntries;
    this.beforePadding = beforePadding;
    this.afterPadding = afterPadding;
    this._changeDetectorRef.markForCheck();
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }
}

