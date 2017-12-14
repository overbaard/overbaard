import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output,
  SimpleChanges
} from '@angular/core';
import {SwimlaneData} from '../../../../../view-model/board/swimlane-data';
import {BoardViewModel} from '../../../../../view-model/board/board-view';
import {UpdateParallelTaskEvent} from '../../../../../events/update-parallel-task.event';
import {IssueSummaryLevel} from '../../../../../model/board/user/issue-summary-level';
import {IssueDetailState} from '../../../../../model/board/user/issue-detail/issue-detail.model';

@Component({
  selector: 'app-kanban-swimlane-entry',
  templateUrl: './kanban-swimlane-entry.component.html',
  styleUrls: ['./kanban-swimlane-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanSwimlaneEntryComponent implements OnInit, OnChanges {

  @Input()
  board: BoardViewModel

  @Input()
  showEmpty: boolean;

  @Input()
  swimlane: SwimlaneData;

  @Input()
  headerTextOffset: number;

  @Input()
  issueDetailState: IssueDetailState;

  @Output()
  toggleCollapsedSwimlane: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  visible: boolean;

  classObj: Object = {'header-colour': true};

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.visible = true;
    if (!this.swimlane.filterVisible) {
      this.visible = false;
    } else if (!this.showEmpty && this.swimlane.visibleIssues === 0) {
      this.visible = false;
    }
  }

// trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  columnTrackByFn(index: number, key: string) {
    return index;
  }

  onToggleCollapsedSwimlane(event: MouseEvent, key: string) {
    this.toggleCollapsedSwimlane.emit(key);
  }

  onMouseEnter() {
    this.classObj['header-colour'] = false;
    this.classObj['header-colour-hover'] = true;
  }

  onMouseLeave() {
    this.classObj['header-colour'] = true;
    this.classObj['header-colour-hover'] = false;
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }

}
