import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FixedHeaderView} from '../fixed-header-view';
import {IssueTable} from '../../../../view-model/board/issue-table/issue-table';
import {HeaderView} from '../../../../view-model/board/issue-table/headers-view';

@Component({
  selector: 'app-kanban-view',
  templateUrl: './kanban-view.component.html',
  styleUrls: ['./kanban-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewComponent extends FixedHeaderView implements OnInit {

  @Input()
  issueTable: IssueTable;

  @Output()
  toggleColumnVisibility: EventEmitter<HeaderView> = new EventEmitter<HeaderView>();

  constructor() {
    super();
  }

  ngOnInit() {
  }

  get boardBodyHeight() {
    // TODO calculate properly taking into account the sizes of the toolbar and the headers, which may be one or two rows
    return this.windowHeight - 150;
  }

  onToggleVisibility(header: HeaderView) {
    this.toggleColumnVisibility.emit(header);
  }
}
