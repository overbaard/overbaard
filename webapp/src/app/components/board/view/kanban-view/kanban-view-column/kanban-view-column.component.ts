import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnChanges, OnInit, Output,
  SimpleChange,
  SimpleChanges
} from '@angular/core';
import {List, Map} from 'immutable';
import {BoardIssueView} from '../../../../../view-model/board/board-issue-view';
import {IssueTable} from '../../../../../view-model/board/issue-table';
import {BoardHeader} from '../../../../../view-model/board/board-header';
import {UpdateParallelTaskEvent} from '../../../../../events/update-parallel-task.event';
import {IssueSummaryLevel} from '../../../../../model/board/user/issue-summary-level';
import {IssueDetailState} from '../../../../../model/board/user/issue-detail/issue-detail.model';
import {Subject} from 'rxjs/Subject';
import {ScrollHeightSplitter, StartAndHeight, VirtualScrollInfo} from '../../../../../common/scroll-height-splitter';
import {RankViewEntry} from '../../../../../view-model/board/rank-view-entry';
import {Observable} from 'rxjs/Observable';

@Component({
  selector: 'app-kanban-view-column',
  templateUrl: './kanban-view-column.component.html',
  styleUrls: ['./kanban-view-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewColumnComponent implements OnInit, OnChanges {

  @Input()
  header: BoardHeader;

  @Input()
  issues: List<BoardIssueView>;

  @Input()
  issueDetailState: IssueDetailState;

  // If a swimlane is collapsed, we still need to display empty columns so the header has the correct width
  @Input()
  displayIssues = true;

  @Input()
  boardBodyHeight: number;

  /**
   * Values emitted here come from the ScrollListenerDirective and are OUTSIDE the angular zone.
   */
  @Input()
  topOffsetObserver: Observable<number>;

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  classList: string[];

  private _destroy$: Subject<void> = new Subject<void>();

  private _splitter: ScrollHeightSplitter<BoardIssueView> = ScrollHeightSplitter.create(rve => rve.calculatedTotalHeight);
  private _scrollTop = 0;
  visibleIssues: List<BoardIssueView>;
  beforePadding = 0;
  afterPadding = 0;

  constructor(private _zone: NgZone, private _changeDetectorRef: ChangeDetectorRef) { }

  ngOnInit() {
    if (this.topOffsetObserver) {
      this.topOffsetObserver
        .takeUntil(this._destroy$)
        .subscribe(
          value => {
            this._scrollTop = value;
            this.calculateVisibleEntries();
          }
        );
    } else {
      // Temp fix to get swimlanes working without virtual scrolling
      this.visibleIssues = this.issues;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['header']) {
      const change: SimpleChange = changes['header'];
      if (change.isFirstChange() || change.previousValue.visible !== change.currentValue.visible) {
        if (this.header.visible) {
          this.classList = ['column', 'visible'];
        } else {
          this.classList = ['column', 'invisible'];
        }
      }
    }
    const issuesChange: SimpleChange = changes['issues'];
    if (issuesChange && issuesChange.currentValue !== issuesChange.previousValue) {
      this._splitter.updateList(this.issues);
      // Force an update here since the underlying list has changed
      if (this.topOffsetObserver) {
        this.calculateVisibleEntries(true);
      } else {
        // Temp fix to get swimlanes working without virtual scrolling
        this.visibleIssues = this.issues;
      }
    }
    const heightChange: SimpleChange = changes['boardBodyHeight'];
    if (heightChange && !heightChange.firstChange && heightChange.currentValue !== heightChange.previousValue) {
      this.calculateVisibleEntries();
    }

  }

  // trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  issueTrackByFn(index: number, issue: BoardIssueView) {
    return issue.key;
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }

  private calculateVisibleEntries(forceUpdate: boolean = false) {
    this._splitter.updateVirtualScrollInfo(
      this._scrollTop,
      this.boardBodyHeight,
      forceUpdate,
      (startIndex: number, endIndex: number, beforePadding: number, afterPadding: number) => {
        let visibleIssues: List<BoardIssueView>;
        if (startIndex === -1) {
          visibleIssues = List<BoardIssueView>();
        } else {
          visibleIssues = <List<BoardIssueView>>this.issues.slice(startIndex, endIndex+ 1);
        }
        this._zone.run(() => {
          this.visibleIssues = visibleIssues;
          this.beforePadding = beforePadding;
          this.afterPadding = afterPadding;
          this._changeDetectorRef.markForCheck();
        });
      });
  }
}
