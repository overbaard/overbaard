import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {BoardIssueVm} from '../../../view-model/board/issue-table/board-issue-vm';
import {Assignee, NO_ASSIGNEE} from '../../../model/board/data/assignee/assignee.model';

@Component({
  selector: 'app-board-issue',
  templateUrl: './board-issue.component.html',
  styleUrls: ['./board-issue.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardIssueComponent implements OnInit {

  readonly noAssignee: Assignee = NO_ASSIGNEE;
  @Input()
  issue: BoardIssueVm;

  constructor() { }

  ngOnInit() {
  }

}
