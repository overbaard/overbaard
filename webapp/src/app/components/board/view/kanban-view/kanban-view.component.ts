import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {FixedHeaderView} from '../fixed-header-view';

@Component({
  selector: 'app-kanban-view',
  templateUrl: './kanban-view.component.html',
  styleUrls: ['./kanban-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewComponent extends FixedHeaderView implements OnInit {

  constructor() {
    super();
  }

  ngOnInit() {
  }

  get boardBodyHeight() {
    // TODO calculate properly taking into account the sizes of the toolbar and the headers, which may be one or two rows
    return this.windowHeight - 150;
  }
}
