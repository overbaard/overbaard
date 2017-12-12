import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {RankViewEntry} from '../../../../view-model/board/rank-view-entry';
import {BoardIssueView} from '../../../../view-model/board/board-issue-view';
import {UpdateParallelTaskEvent} from '../../../../events/update-parallel-task.event';

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

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  constructor() {
  }

  ngOnInit() {
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }

}
