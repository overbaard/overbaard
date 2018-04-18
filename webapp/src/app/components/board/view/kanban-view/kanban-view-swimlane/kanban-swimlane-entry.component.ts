import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, NgZone, OnChanges, OnDestroy, OnInit, Output, SimpleChange,
  SimpleChanges
} from "@angular/core";
import {SwimlaneData} from '../../../../../view-model/board/swimlane-data';
import {BoardViewModel} from '../../../../../view-model/board/board-view';
import {UpdateParallelTaskEvent} from '../../../../../events/update-parallel-task.event';
import {IssueSummaryLevel} from '../../../../../model/board/user/issue-summary-level';
import {IssueDetailState} from '../../../../../model/board/user/issue-detail/issue-detail.model';
import {BoardHeaders} from '../../../../../view-model/board/board-headers';
import {StartAndHeight} from "../../../../../common/scroll-height-splitter";
import {Observable} from "rxjs/Observable";
import {Subject} from "rxjs/Subject";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {ScrollPositionAndHeight} from '../../../../../common/scroll-position-height';

@Component({
  selector: 'app-kanban-swimlane-entry',
  templateUrl: './kanban-swimlane-entry.component.html',
  styleUrls: ['./kanban-swimlane-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanSwimlaneEntryComponent implements OnInit, OnChanges, OnDestroy {

  @Input()
  headers: BoardHeaders;

  @Input()
  showEmpty: boolean;

  @Input()
  swimlane: SwimlaneData;

  @Input()
  headerTextOffset: number;

  @Input()
  issueDetailState: IssueDetailState;

  @Input()
  startAndHeight: StartAndHeight;

  /**
   * Values emitted here come from the ScrollListenerDirective and are OUTSIDE the angular zone.
   */
  @Input()
  scrollPositionObserver$: Observable<ScrollPositionAndHeight>;

  @Output()
  toggleCollapsedSwimlane: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  private _scrollPositionAndHeight: ScrollPositionAndHeight;
  adjustedTopOffsetObserver$: Subject<number> = new BehaviorSubject<number>(0);
  adjustedHeight: number;

  visible: boolean;

  private _destroy$: Subject<void> = new Subject<void>();

  classObj: Object = {'header-colour': true};

  constructor(private _zone: NgZone) {
  }

  ngOnInit() {
    this.scrollPositionObserver$
      .takeUntil(this._destroy$)
      .subscribe(
        scrollPositionAndHeight => {
          this._scrollPositionAndHeight = scrollPositionAndHeight;
          this.calculateInternalOffset(true);
        }
      );
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.visible = true;
    if (!this.showEmpty && this.swimlane.visibleIssues === 0) {
      this.visible = false;
    }

    const heightChange: SimpleChange = changes['boardBodyHeight'];
    const startAndHeightChange: SimpleChange = changes['startAndHeight'];
    if (heightChange || startAndHeightChange) {
      this.calculateInternalOffset(false);
    }
  }

  ngOnDestroy(): void {
    this._destroy$.next(null);
  }

  calculateInternalOffset(scrollChange: boolean) {
    if (scrollChange) {
      this._zone.runOutsideAngular(() => {
        this.doCalculateInternalOffset();
      })
    } else {
      this.doCalculateInternalOffset();
    }
  }

  doCalculateInternalOffset() {
    let internalPosition = 0;
    const tableStart = this._scrollPositionAndHeight.scrollPos + this.swimlane.headerHeight;
    if (this._scrollPositionAndHeight.scrollPos >= tableStart) {
      internalPosition = this._scrollPositionAndHeight.scrollPos - tableStart;
    }

    const end: number = this._scrollPositionAndHeight.scrollPos + this._scrollPositionAndHeight.height;
    let internalHeight = 0;
    if (end >= tableStart + this.swimlane.calculatedTotalIssuesHeight) {
      internalHeight = end - tableStart;
    }
  }

// trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  columnTrackByFn(index: number, key: string) {
    return index;
  }

  onToggleCollapsedSwimlane(event: MouseEvent, key: string) {
    this.toggleCollapsedSwimlane.emit(key);
  }

  onMouseEnter() {
    this.classObj['header-colour'] = false;
    this.classObj['header-colour-hover'] = true;
  }

  onMouseLeave() {
    this.classObj['header-colour'] = true;
    this.classObj['header-colour-hover'] = false;
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }

}
