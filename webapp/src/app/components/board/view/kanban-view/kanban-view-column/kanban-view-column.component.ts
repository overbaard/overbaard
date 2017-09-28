import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {BoardIssue} from '../../../../../common/board/issue/issue.model';
import {List} from 'immutable';

/* tslint:disable:component-selector */
@Component({
  selector: '[app-kanban-view-column]',
  templateUrl: './kanban-view-column.component.html',
  styleUrls: ['./kanban-view-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewColumnComponent implements OnInit {

  @Input()
  issues: List<BoardIssue>;

  constructor() { }

  ngOnInit() {
  }
}
