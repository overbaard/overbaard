import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {SwimlaneData} from '../../../../../view-model/board/swimlane-data';
import {BoardViewModel} from '../../../../../view-model/board/board-view';
import {SwimlaneInfo} from '../../../../../view-model/board/swimlane-info';
import {UpdateParallelTaskEvent} from '../../../../../events/update-parallel-task.event';

@Component({
  selector: 'app-kanban-swimlane-view',
  templateUrl: './kanban-swimlane-view.component.html',
  styleUrls: ['./kanban-swimlane-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanSwimlaneViewComponent implements OnInit {

  @Input()
  board: BoardViewModel;

  @Input()
  headerTextOffset: number;

  @Output()
  scrollTableBodyX: EventEmitter<number> = new EventEmitter<number>();

  @Output()
  toggleCollapsedSwimlane: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  constructor() {
  }

  ngOnInit() {
  }

  // trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  columnTrackByFn(index: number, swimlaneData: SwimlaneData) {
    return swimlaneData.key;
  }

  get swimlaneInfo(): SwimlaneInfo {
    return this.board.issueTable.swimlaneInfo;
  }

  onToggleCollapsedSwimlane(key: string) {
    this.toggleCollapsedSwimlane.emit(key);
  }

  onUpdateParallelTask(event: UpdateParallelTaskEvent) {
    this.updateParallelTask.emit(event);
  }

}
