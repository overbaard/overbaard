import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {IssueTable, SwimlaneInfo} from '../../../../../view-model/board/issue-table/issue-table';
import {BoardIssueView} from '../../../../../view-model/board/issue-table/board-issue-view';

@Component({
  selector: 'app-kanban-swimlane-view',
  templateUrl: './kanban-swimlane-view.component.html',
  styleUrls: ['./kanban-swimlane-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanSwimlaneViewComponent implements OnInit {

  @Input()
  swimlaneInfo: SwimlaneInfo;

  @Input()
  issues: Map<string, BoardIssueView>;

  constructor() {
  }

  ngOnInit() {
  }

  // trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  columnTrackByFn(index: number, key: string) {
    return index;
  }
}
