import {ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, NgZone, OnDestroy, OnInit, Output} from '@angular/core';
import {FixedHeaderView} from '../fixed-header-view';
import {BoardHeader} from '../../../../view-model/board/board-header';
import {BoardViewMode} from '../../../../model/board/user/board-view-mode';
import {UpdateParallelTaskEvent} from '../../../../events/update-parallel-task.event';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';
import {ScrollPositionAndHeightSubject} from '../../../../common/scroll-position-height.subject';
import {ScrollPositionAndHeight} from '../../../../common/scroll-position-height';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-kanban-view',
  templateUrl: './kanban-view.component.html',
  styleUrls: ['./kanban-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewComponent extends FixedHeaderView implements OnInit, OnDestroy {

  @Output()
  toggleColumnVisibility: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  @Output()
  toggleBacklog: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  @Output()
  toggleCollapsedSwimlane: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  private _lastScrollPosAndHeight: ScrollPositionAndHeight = {scrollPos: 0, height: 0};
  // Events here happen OUTSIDE the angular zone
  scrollTopObserver$: Subject<number> = new BehaviorSubject<number>(0);
  scrollPositionObserver$: ScrollPositionAndHeightSubject = new ScrollPositionAndHeightSubject();


  readonly viewMode =  BoardViewMode.KANBAN;

  private destroy$: Subject<void> = new Subject<void>();

  constructor(changeDetector: ChangeDetectorRef, zone: NgZone) {
    super(changeDetector, zone);
  }

  ngOnInit() {
    super.observeLeftScroll(this.destroy$);
    this.scrollTopObserver$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(scrollPos => {
        this.emitNewHeight(scrollPos, this.boardBodyHeight);
      });
  }

  boardBodyHeightChanged() {
    this._zone.runOutsideAngular(() => {
      // Do this outside angular to have the same behaviour in all children consuming this observable
      requestAnimationFrame(() => {
        this.emitNewHeight(this._lastScrollPosAndHeight.scrollPos, this.boardBodyHeight);
      });
    });
  }

  private emitNewHeight(scrollPos: number, height: number) {
    // Make a copy here, or weird things happen in the listeners
    const copy: ScrollPositionAndHeight = {scrollPos: scrollPos, height: height};
    this.scrollPositionObserver$.next(copy);
    this._lastScrollPosAndHeight = copy;
  }

  ngOnDestroy(): void {
    this.destroy$.next(null);
  }

  onToggleVisibility(header: BoardHeader) {
    this.toggleColumnVisibility.emit(header);
  }

  onToggleBacklog(header: BoardHeader) {
    this.toggleBacklog.next(header);
  }

  onToggleCollapsedSwimlane(key: string) {
    this.toggleCollapsedSwimlane.emit(key);
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }
}
