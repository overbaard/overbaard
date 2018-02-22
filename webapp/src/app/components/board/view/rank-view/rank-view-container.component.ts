import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BoardViewMode} from '../../../../model/board/user/board-view-mode';
import {BoardViewModel} from '../../../../view-model/board/board-view';
import {UpdateParallelTaskEvent} from '../../../../events/update-parallel-task.event';
import {IssueSummaryLevel} from '../../../../model/board/user/issue-summary-level';
import {IssueDetailState} from '../../../../model/board/user/issue-detail/issue-detail.model';
import {Observable} from 'rxjs/Observable';

@Component({
  selector: 'app-rank-view-container',
  templateUrl: './rank-view-container.component.html',
  styleUrls: ['./rank-view-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankViewContainerComponent implements OnInit {

  @Input()
  board: BoardViewModel;

  /**
   * Values emitted here come from the ScrollListenerDirective and are OUTSIDE the angular zone.
   */
  @Input()
  topOffsetObserver: Observable<number>;

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  readonly viewMode = BoardViewMode.RANK;

  // Just an array here to be able to do 'for s of states; let i = index' in the entry template
  @Input()
  statesDummyArray: number[];

  constructor() {
  }

  ngOnInit() {
    this.topOffsetObserver.subscribe(
      value => console.log(value)
    );
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }

}
