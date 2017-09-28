import {Component, Input, OnInit} from '@angular/core';
import {BoardIssue} from '../../../common/board/issue/issue.model';

@Component({
  selector: 'app-board-issue',
  templateUrl: './board-issue.component.html',
  styleUrls: ['./board-issue.component.scss']
})
export class BoardIssueComponent implements OnInit {

  @Input()
  issue: BoardIssue;

  constructor() { }

  ngOnInit() {
  }

}
