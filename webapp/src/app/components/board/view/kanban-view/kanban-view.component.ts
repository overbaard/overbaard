import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {FixedHeaderView} from '../fixed-header-view';
import {IssueTableVm} from '../../../../view-model/board/issue-table/issue-table-vm';

@Component({
  selector: 'app-kanban-view',
  templateUrl: './kanban-view.component.html',
  styleUrls: ['./kanban-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewComponent extends FixedHeaderView implements OnInit {

  @Input()
  issueTable: IssueTableVm;

  constructor() {
    super();
  }

  ngOnInit() {
  }

  get boardBodyHeight() {
    // TODO calculate properly taking into account the sizes of the toolbar and the headers, which may be one or two rows
    return this.windowHeight - 150;
  }

  // trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  columnTrackByFn(index: number, key: string) {
    return index;
  }
}
