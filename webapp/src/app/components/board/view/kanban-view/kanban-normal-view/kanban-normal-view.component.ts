import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BoardViewModel} from '../../../../../view-model/board/board-view';
import {UpdateParallelTaskEvent} from '../../../../../events/update-parallel-task.event';
import {IssueSummaryLevel} from '../../../../../model/board/user/issue-summary-level';
import {IssueDetailState} from '../../../../../model/board/user/issue-detail/issue-detail.model';
import {Observable} from 'rxjs/Observable';

@Component({
  selector: 'app-kanban-normal-view',
  templateUrl: './kanban-normal-view.component.html',
  styleUrls: ['./kanban-normal-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanNormalViewComponent implements OnInit {

  @Input()
  board: BoardViewModel;

  @Input()
  boardBodyHeight: number;
  /**
   * Values emitted here come from the ScrollListenerDirective and are OUTSIDE the angular zone.
   */
  @Input()
  scrollPositionObserver$: Observable<number>;

  @Output()
  scrollTableBodyX: EventEmitter<number> = new EventEmitter<number>();

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  constructor() {
  }

  ngOnInit() {
  }

  // trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  columnTrackByFn(index: number, key: string) {
    return index;
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }
}
