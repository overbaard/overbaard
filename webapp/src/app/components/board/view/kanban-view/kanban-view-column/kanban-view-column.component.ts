import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnInit,
  Output,
  SimpleChange,
  SimpleChanges
} from '@angular/core';
import {List, Map} from 'immutable';
import {BoardIssueView} from '../../../../../view-model/board/board-issue-view';
import {BoardHeader} from '../../../../../view-model/board/board-header';
import {UpdateParallelTaskEvent} from '../../../../../events/update-parallel-task.event';
import {IssueDetailState} from '../../../../../model/board/user/issue-detail/issue-detail.model';
import {Subject, Observable} from 'rxjs';
import {ScrollHeightSplitter} from '../../../../../common/scroll-height-splitter';
import {takeUntil} from 'rxjs/operators';
import {ScrollPositionAndHeight} from '../../../../../common/scroll-position-height';
import {RankViewEntry} from '../../../../../view-model/board/rank-view-entry';

@Component({
  selector: 'app-kanban-view-column',
  templateUrl: './kanban-view-column.component.html',
  styleUrls: ['./kanban-view-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewColumnComponent implements OnInit, OnChanges {

  /*static tempCounter = 0;
  private tmpColumnNo;*/

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
  rankOrdersByProject: Map<string, Map<string, number>>;

  /**
   * Values emitted here come from the ScrollListenerDirective and are OUTSIDE the angular zone.
   */
  @Input()
  scrollPositionObserver$: Observable<ScrollPositionAndHeight>;

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  classList: string[];

  private _destroy$: Subject<void> = new Subject<void>();

  private _splitter: ScrollHeightSplitter<BoardIssueView> = ScrollHeightSplitter.create(false, 1, bi => bi.calculatedTotalHeight);
  private _scrollPosAndHeight = {scrollPos: -1, height: 0};

  visibleIssues: List<BoardIssueView>;
  beforePadding = 0;
  afterPadding = 0;
  backgroundPaddingClass: string;

  constructor(private _zone: NgZone, private _changeDetectorRef: ChangeDetectorRef) {
    // this.tmpColumnNo = KanbanViewColumnComponent.tempCounter++;
  }

  ngOnInit() {
    this.backgroundPaddingClass = this.header.backlog ? 'diagonal-background-accent' : 'diagonal-background-primary';
    this.scrollPositionObserver$
      .pipe(
        takeUntil(this._destroy$)
      )
      .subscribe(
        scrollPosAndHeight => {
          this._scrollPosAndHeight = scrollPosAndHeight;
          this.calculateVisibleEntries();
        }
      );
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
      requestAnimationFrame(() => {
        this.calculateVisibleEntries(true);
      });
    }
  }

  // trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  issueTrackByFn(index: number, issue: BoardIssueView) {
    return issue.key;
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }

  private getRankOrder(issue: BoardIssueView): number {
    const ranks: Map<string, number> = this.rankOrdersByProject.get(issue.projectCode);
    if (!ranks) {
      return null;
    }
    return ranks.get(issue.key);
  }

  private getTotalIssuesForProject(issue: BoardIssueView): number {
    const ranks: Map<string, number> = this.rankOrdersByProject.get(issue.projectCode);
    if (!ranks) {
      return null;
    }
    return ranks.size;
  }


  private calculateVisibleEntries(forceUpdate: boolean = false) {
    this._splitter.updateVirtualScrollInfo(
      this._scrollPosAndHeight.scrollPos,
      this._scrollPosAndHeight.height,
      forceUpdate,
      (startIndex: number, endIndex: number, beforePadding: number, afterPadding: number) => {
        let visibleIssues: List<BoardIssueView>;
        if (startIndex === -1) {
          visibleIssues = List<BoardIssueView>();
        } else {
          // if (endIndex > 0) {
          //   console.log(`Col ${this.tmpColumnNo}: ${startIndex}-${endIndex} ${this.beforePadding}/${this.afterPadding} ` +
          //   `${this.issues.slice(startIndex, endIndex + 1).map(i => i.key).toArray()}`);
          // }
          visibleIssues = <List<BoardIssueView>>this.issues.slice(startIndex, endIndex + 1);
        }

        // console.log(`Update issues ${startIndex} ${endIndex}`);


        if (NgZone.isInAngularZone()) {
          // When called from ngOnChanges, it will be in the angular zone, otherwise it is not
          this.updateVisibleIssues(visibleIssues, beforePadding, afterPadding);
        } else {
          this._zone.run(() => {
            this.updateVisibleIssues(visibleIssues, beforePadding, afterPadding);
          });
        }
      });
  }

  private updateVisibleIssues(visibleIssues: List<BoardIssueView>, beforePadding: number, afterPadding: number) {
    this.visibleIssues = visibleIssues;
    this.beforePadding = beforePadding;
    this.afterPadding = afterPadding;
    this._changeDetectorRef.markForCheck();
  }
}
