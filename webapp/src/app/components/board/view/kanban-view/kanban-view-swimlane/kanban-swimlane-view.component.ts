import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, NgZone, OnChanges, OnInit,
  Output, SimpleChange, SimpleChanges
} from '@angular/core';
import {SwimlaneData} from '../../../../../view-model/board/swimlane-data';
import {BoardViewModel} from '../../../../../view-model/board/board-view';
import {SwimlaneInfo} from '../../../../../view-model/board/swimlane-info';
import {UpdateParallelTaskEvent} from '../../../../../events/update-parallel-task.event';
import {IssueSummaryLevel} from '../../../../../model/board/user/issue-summary-level';
import {IssueDetailState} from '../../../../../model/board/user/issue-detail/issue-detail.model';
import {Observable} from 'rxjs/Observable';
import {List} from 'immutable';
import {ScrollHeightSplitter} from '../../../../../common/scroll-height-splitter';
import {BoardIssueView} from '../../../../../view-model/board/board-issue-view';
import {BoardHeaders} from '../../../../../view-model/board/board-headers';
import {Subject} from 'rxjs/Subject';

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
  topOffsetObserver: Observable<number>;

  @Input()
  boardBodyHeight: number;

  @Output()
  scrollTableBodyX: EventEmitter<number> = new EventEmitter<number>();

  @Output()
  toggleCollapsedSwimlane: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  private _destroy$: Subject<void> = new Subject<void>();

  private _swimlanes: List<SwimlaneData>;
  private _splitter: ScrollHeightSplitter<SwimlaneData> = ScrollHeightSplitter.create(sl => sl.calculatedTotalHeight);
  private _scrollTop = 0;
  visibleSwimlanes: List<SwimlaneData>;
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

  ngOnChanges(changes: SimpleChanges) {
    const swimlaneInfoChange: SimpleChange = changes['swimlaneInfo'];
    if (swimlaneInfoChange && swimlaneInfoChange.currentValue !== swimlaneInfoChange.previousValue) {
      this._swimlanes = List<SwimlaneData>(this.swimlaneInfo.swimlanes.values());
      this._splitter.updateList(this._swimlanes);
      console.log(JSON.stringify(this._splitter.startPositions));
      this.calculateVisibleEntries(true);
    }
    const heightChange: SimpleChange = changes['boardBodyHeight'];
    if (heightChange && !heightChange.firstChange && heightChange.currentValue !== heightChange.previousValue) {
      this.calculateVisibleEntries();
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
      this._scrollTop,
      this.boardBodyHeight,
      forceUpdate,
      (startIndex: number, endIndex: number, beforePadding: number, afterPadding: number) => {
        let visibleSwimlanes: List<SwimlaneData>;
        if (startIndex === -1) {
          visibleSwimlanes = List<SwimlaneData>();
        } else {
          visibleSwimlanes = <List<SwimlaneData>>this._swimlanes.slice(startIndex, endIndex + 1);
        }
        console.log(`${startIndex}-${endIndex} ${this.beforePadding}/${this.afterPadding} ${this._swimlanes.slice(startIndex, endIndex).map(i => i.display).toArray()}`);
        this._zone.run(() => {
          this.visibleSwimlanes = visibleSwimlanes;
          this.beforePadding = beforePadding;
          this.afterPadding = afterPadding;
          this._changeDetectorRef.markForCheck();
        });
      });
  }
}
