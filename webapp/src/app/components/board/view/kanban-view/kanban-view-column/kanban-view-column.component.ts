import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {List, Map} from 'immutable';
import {BoardIssueView} from '../../../../../view-model/board/issue-table/board-issue-view';

/* tslint:disable:component-selector */
@Component({
  selector: '[app-kanban-view-column]',
  templateUrl: './kanban-view-column.component.html',
  styleUrls: ['./kanban-view-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewColumnComponent implements OnInit {

  @Input()
  issues: Map<string, BoardIssueView>;
  @Input()
  issueKeys: List<string>;
  @Input()
  visible: boolean;

  constructor() { }

  ngOnInit() {
  }

  // trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  issueTrackByFn(index: number, key: string) {
    return key;
  }

}
