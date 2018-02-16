import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChange,
  SimpleChanges
} from '@angular/core';
import {List, Map} from 'immutable';
import {BoardIssueView} from '../../../../../view-model/board/board-issue-view';
import {IssueTable} from '../../../../../view-model/board/issue-table';
import {BoardHeader} from '../../../../../view-model/board/board-header';
import {UpdateParallelTaskEvent} from '../../../../../events/update-parallel-task.event';
import {IssueSummaryLevel} from '../../../../../model/board/user/issue-summary-level';
import {IssueDetailState} from '../../../../../model/board/user/issue-detail/issue-detail.model';

@Component({
  selector: 'app-kanban-view-column-group]',
  templateUrl: './kanban-view-column-group.component.html',
  styleUrls: ['./kanban-view-column-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewColumnGroupComponent implements OnInit, OnChanges {

  @Input()
  header: BoardHeader;

  @Input()
  table: List<List<BoardIssueView>>;

  @Input()
  issueDetailState: IssueDetailState;

  // If a swimlane is collapsed, we still need to display empty columns so the header has the correct width
  @Input()
  displayIssues = true;

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();


  readonly visible_bl_or_normal_state = 0;
  readonly visible_bl_or_normal_category = 1;
  readonly invisible_bl = 2;
  groupType: number;

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['header']) {
      const change: SimpleChange = changes['header'];
      if (change.firstChange || change.currentValue.visible !== change.previousValue.visible) {
        if (!this.header.backlog || (this.header.backlog && this.header.visible)) {
          this.groupType = this.header.category ?
            this.visible_bl_or_normal_category : this.visible_bl_or_normal_state;
        } else {
          this.groupType = this.invisible_bl;
        }
      }
    }
  }

// trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  headerStateTrackByFn(index: number, header: BoardHeader) {
    return header.name;
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }

}
