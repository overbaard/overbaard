import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, NgZone, OnDestroy, OnInit, Output,
  SimpleChanges
} from '@angular/core';
import {FixedHeaderView} from '../fixed-header-view';
import {BoardHeader} from '../../../../view-model/board/board-header';
import {BoardViewMode} from '../../../../model/board/user/board-view-mode';
import {UpdateParallelTaskEvent} from '../../../../events/update-parallel-task.event';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Subject} from 'rxjs/Subject';

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


  readonly viewMode =  BoardViewMode.KANBAN;

  private destroy$: Subject<void> = new Subject<void>();

  constructor(changeDetector: ChangeDetectorRef, zone: NgZone) {
    super(changeDetector, zone);
  }

  ngOnInit() {
    super.observeLeftScroll(this.destroy$)
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
