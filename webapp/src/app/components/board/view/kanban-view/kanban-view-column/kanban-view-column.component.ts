import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {List, Map} from 'immutable';
import {BoardIssueVm} from '../../../../../view-model/board/issue-table/board-issue-vm';

/* tslint:disable:component-selector */
@Component({
  selector: '[app-kanban-view-column]',
  templateUrl: './kanban-view-column.component.html',
  styleUrls: ['./kanban-view-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewColumnComponent implements OnInit {

  @Input()
  issues: Map<string, BoardIssueVm>;
  @Input()
  issueKeys: List<string>;
  @Input()
  issueVisibilities: Map<string, boolean>;



  constructor() { }

  ngOnInit() {
  }

  // trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  issueTrackByFn(index: number, key: string) {
    return key;
  }

}
