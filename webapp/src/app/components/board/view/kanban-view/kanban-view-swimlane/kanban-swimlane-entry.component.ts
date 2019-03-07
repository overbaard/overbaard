import {
  ChangeDetectionStrategy,
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
import {SwimlaneData} from '../../../../../view-model/board/swimlane-data';
import {UpdateParallelTaskEvent} from '../../../../../events/update-parallel-task.event';
import {IssueDetailState} from '../../../../../model/board/user/issue-detail/issue-detail.model';
import {BoardHeaders} from '../../../../../view-model/board/board-headers';
import {StartAndHeight} from '../../../../../common/scroll-height-splitter';
import {Observable, Subject, BehaviorSubject} from 'rxjs';
import {ScrollPositionAndHeight} from '../../../../../common/scroll-position-height';
import {takeUntil} from 'rxjs/operators';
import {Map} from 'immutable';

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

  @Input()
  rankOrdersByProject: Map<string, Map<string, number>>;


  /**
   * Values emitted here come from the ScrollListenerDirective and are OUTSIDE the angular zone.
   */
  @Input()
  scrollPositionObserver$: Observable<ScrollPositionAndHeight>;

  @Output()
  toggleCollapsedSwimlane: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  private _scrollPositionAndHeight: ScrollPositionAndHeight = {scrollPos: -1, height: 0};

  adjustedScrollPositionObserver$: Subject<ScrollPositionAndHeight> =
    new BehaviorSubject<ScrollPositionAndHeight>(this._scrollPositionAndHeight);

  visible: boolean;

  private _destroy$: Subject<void> = new Subject<void>();

  classObj: Object = {'header-colour': true};

  constructor(private _zone: NgZone) {
  }

  ngOnInit() {
    console.log(`==== ${this.swimlane.key}  ${this.swimlane.headerHeight} ` +
      ` ${this.swimlane.calculatedTotalIssuesHeight} ${JSON.stringify(this.startAndHeight)}`);
    this.scrollPositionObserver$
      .pipe(
        takeUntil(this._destroy$)
      )
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

    const startAndHeightChange: SimpleChange = changes['startAndHeight'];
    if (startAndHeightChange && startAndHeightChange.currentValue) {
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
      });
    } else {
      this.doCalculateInternalOffset();
    }
  }

  doCalculateInternalOffset() {
    let internalPosition = 0;
    if (!this.swimlane) {
      return;
    }
    const tableStart = this.startAndHeight.start + this.swimlane.headerHeight;
    if (this._scrollPositionAndHeight.scrollPos >= tableStart) {
      internalPosition = this._scrollPositionAndHeight.scrollPos - tableStart;
    }

    const endVisible: number = this._scrollPositionAndHeight.scrollPos + this._scrollPositionAndHeight.height;
    let internalHeight = 0;
    const endData: number = tableStart + this.swimlane.calculatedTotalIssuesHeight;

    // console.log(`${this.swimlane.key} ts: ${tableStart}, ip: ${internalPosition}, ev: ${endVisible}, ed: ${endData}`);

    if (endVisible >= endData) {
      internalHeight = endData - tableStart - internalPosition;
    } else {
      internalHeight = endVisible - tableStart - internalPosition;
    }

    // console.log(`adjusted: ${JSON.stringify(
    //  {scrollPos: internalPosition, height: internalHeight, original: this._scrollPositionAndHeight})}`);
    this.adjustedScrollPositionObserver$.next({scrollPos: internalPosition, height: internalHeight});
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

  onClickLink(event: MouseEvent) {
    event.stopImmediatePropagation();
  }
}
