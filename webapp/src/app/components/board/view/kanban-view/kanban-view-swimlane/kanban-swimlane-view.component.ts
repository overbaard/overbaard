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
import {SwimlaneData} from '../../../../../view-model/board/swimlane-data';
import {SwimlaneInfo} from '../../../../../view-model/board/swimlane-info';
import {UpdateParallelTaskEvent} from '../../../../../events/update-parallel-task.event';
import {IssueDetailState} from '../../../../../model/board/user/issue-detail/issue-detail.model';
import {Observable} from 'rxjs/Observable';
import {List} from 'immutable';
import {ScrollHeightSplitter, StartAndHeight} from '../../../../../common/scroll-height-splitter';
import {BoardHeaders} from '../../../../../view-model/board/board-headers';
import {Subject} from 'rxjs/Subject';
import {takeUntil} from 'rxjs/operators';
import {ScrollPositionAndHeight} from '../../../../../common/scroll-position-height';

@Component({
  selector: 'app-kanban-swimlane-view',
  templateUrl: './kanban-swimlane-view.component.html',
  styleUrls: ['./kanban-swimlane-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanSwimlaneViewComponent implements OnInit, OnChanges {

  @Input()
  headers: BoardHeaders;

  @Input()
  swimlaneInfo: SwimlaneInfo;

  @Input()
  issueDetailState: IssueDetailState;

  @Input()
  headerTextOffset: number;

  /**
   * Values emitted here come from the ScrollListenerDirective and are OUTSIDE the angular zone.
   */
  @Input()
  scrollPositionObserver$: Observable<ScrollPositionAndHeight>;

  @Output()
  scrollTableBodyX: EventEmitter<number> = new EventEmitter<number>();

  @Output()
  toggleCollapsedSwimlane: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  private _destroy$: Subject<void> = new Subject<void>();

  private _swimlanes: List<SwimlaneData>;

  private _splitter: ScrollHeightSplitter<SwimlaneData> =
    ScrollHeightSplitter.create(true, 0, sl => {
      let height: number = sl.headerHeight;
      if (!sl.collapsed) {
        height += sl.calculatedTotalIssuesHeight;
      }
      return height;
    });

  private _scrollPositionAndHeight: ScrollPositionAndHeight = {scrollPos: 0, height: 0};
  visibleSwimlanes: List<SwimlaneData>;
  startIndex = 0;
  beforePadding = 0;
  afterPadding = 0;
  startAndHeights: List<StartAndHeight>;



  constructor(private _zone: NgZone, private _changeDetectorRef: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.scrollPositionObserver$
      .pipe(
        takeUntil(this._destroy$)
      )
      .subscribe(
        scrollPositionAndHeight => {
          this._scrollPositionAndHeight = scrollPositionAndHeight;
          this.calculateVisibleEntries();
        }
      );
  }

  ngOnChanges(changes: SimpleChanges) {
    const swimlaneInfoChange: SimpleChange = changes['swimlaneInfo'];
    if (swimlaneInfoChange && swimlaneInfoChange.currentValue !== swimlaneInfoChange.previousValue) {
      this._swimlanes = List<SwimlaneData>(this.swimlaneInfo.swimlanes.values());
      this._splitter.updateList(this._swimlanes);
      this.startAndHeights = this._splitter.startPositions;
      // console.log('----> topOffsets' + JSON.stringify(this.topOffsets));
      requestAnimationFrame(() => {
        this.calculateVisibleEntries(true);
      });
    }
  }

  // trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  columnTrackByFn(index: number, swimlaneData: SwimlaneData) {
    return swimlaneData.key;
  }

  onToggleCollapsedSwimlane(key: string) {
    this.toggleCollapsedSwimlane.emit(key);
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }

  private calculateVisibleEntries(forceUpdate: boolean = false) {
    this._splitter.updateVirtualScrollInfo(
      this._scrollPositionAndHeight.scrollPos,
      this._scrollPositionAndHeight.height,
      forceUpdate,
      (startIndex: number, endIndex: number, beforePadding: number, afterPadding: number) => {
        let visibleSwimlanes: List<SwimlaneData>;
        if (startIndex === -1) {
          visibleSwimlanes = List<SwimlaneData>();
        } else {
          visibleSwimlanes = <List<SwimlaneData>>this._swimlanes.slice(startIndex, endIndex + 1);
        }
        this.startIndex = startIndex;

        // console.log(`${startIndex}-${endIndex} ${beforePadding}/${afterPadding} ` +
        //   `${this._swimlanes.slice(startIndex, endIndex + 1).map(i => i.display).toArray()}`);

        if (NgZone.isInAngularZone()) {
          // When called from ngOnChanges, it will be in the angular zone, otherwise it is not
          this.updateVisibleSwimlanes(visibleSwimlanes, beforePadding, afterPadding);
        } else {
          this._zone.run(() => {
            this.updateVisibleSwimlanes(visibleSwimlanes, beforePadding, afterPadding);
          });
        }
      });
  }

  private updateVisibleSwimlanes(visibleSwimlanes: List<SwimlaneData>, beforePadding: number, afterPadding: number) {
    this.visibleSwimlanes = visibleSwimlanes;
    this.beforePadding = beforePadding;
    this.afterPadding = afterPadding;
    this._changeDetectorRef.markForCheck();
  }
}
