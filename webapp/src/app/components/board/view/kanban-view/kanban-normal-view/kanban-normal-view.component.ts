import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {IssueTable} from '../../../../../view-model/board/issue-table/issue-table';

@Component({
  selector: 'app-kanban-normal-view',
  templateUrl: './kanban-normal-view.component.html',
  styleUrls: ['./kanban-normal-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanNormalViewComponent implements OnInit {

  @Input()
  issueTable: IssueTable;

  constructor() {
  }

  ngOnInit() {
  }

  // trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  columnTrackByFn(index: number, key: string) {
    return index;
  }
}
