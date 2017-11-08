import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {IssueTable, SwimlaneData, SwimlaneInfo} from '../../../../../view-model/board/issue-table/issue-table';
import {BoardIssueView} from '../../../../../view-model/board/issue-table/board-issue-view';

@Component({
  selector: 'app-kanban-swimlane-entry',
  templateUrl: './kanban-swimlane-entry.component.html',
  styleUrls: ['./kanban-swimlane-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanSwimlaneEntryComponent implements OnInit {

  @Input()
  swimlane: SwimlaneData;

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
