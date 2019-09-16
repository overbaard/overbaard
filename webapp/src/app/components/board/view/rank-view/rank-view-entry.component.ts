import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {RankViewEntry} from '../../../../view-model/board/rank-view-entry';
import {UpdateParallelTaskEvent} from '../../../../events/update-parallel-task.event';
import {BoardViewMode} from '../../../../model/board/user/board-view-mode';
import {IssueDetailState} from '../../../../model/board/user/issue-detail/issue-detail.model';
import {BoardHeader} from '../../../../view-model/board/board-header';
import {List} from 'immutable';

@Component({
  selector: 'app-rank-view-entry',
  templateUrl: './rank-view-entry.component.html',
  styleUrls: ['./rank-view-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RankViewEntryComponent {

  @Input()
  rankEntry: RankViewEntry;

  @Input()
  issueDetailState: IssueDetailState;

  @Input()
  rankOrder: number;

  @Input()
  totalProjectIssues: number;

  @Input()
  flattenedHeaders: List<BoardHeader>;

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  rankViewMode: BoardViewMode = BoardViewMode.RANK;

  constructor() {
  }



  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }

  matchesSearchAndVisibleState(header: BoardHeader): boolean {
    return this.rankEntry.issue.matchesSearch && header.visible;
  }
}
