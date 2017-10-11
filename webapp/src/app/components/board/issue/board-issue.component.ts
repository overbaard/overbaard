import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';

@Component({
  selector: 'app-board-issue',
  templateUrl: './board-issue.component.html',
  styleUrls: ['./board-issue.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardIssueComponent implements OnInit {

  @Input()
  issue: BoardIssue;

  constructor() { }

  ngOnInit() {
  }

}
