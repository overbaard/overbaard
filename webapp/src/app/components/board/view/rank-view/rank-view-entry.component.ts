import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {RankViewEntry} from '../../../../view-model/board/rank-view-entry';
import {BoardIssueView} from '../../../../view-model/board/board-issue-view';
import {UpdateParallelTaskEvent} from '../../../../events/update-parallel-task.event';
import {BoardViewMode} from '../../../../model/board/user/board-view-mode';
import {IssueDetailState} from '../../../../model/board/user/issue-detail/issue-detail.model';

@Component({
  selector: 'app-rank-view-entry',
  templateUrl: './rank-view-entry.component.html',
  styleUrls: ['./rank-view-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankViewEntryComponent implements OnInit {

  @Input()
  rankEntry: RankViewEntry

  @Input()
  issue: BoardIssueView;

  // Just an array here to be able to do 'for s of states; let i = index' in the template
  @Input()
  statesDummyArray: number[];

  @Input()
  issueDetailState: IssueDetailState;


  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  rankViewMode: BoardViewMode = BoardViewMode.RANK;

  constructor() {
  }

  ngOnInit() {
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }

}
