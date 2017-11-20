import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FixedHeaderView} from '../fixed-header-view';
import {BoardHeader} from '../../../../view-model/board/board-header';

@Component({
  selector: 'app-kanban-view',
  templateUrl: './kanban-view.component.html',
  styleUrls: ['./kanban-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewComponent extends FixedHeaderView implements OnInit {

  @Output()
  toggleColumnVisibility: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  @Output()
  toggleBacklog: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  constructor() {
    super();
  }

  ngOnInit() {
  }

  get boardBodyHeight() {
    // TODO calculate properly taking into account the sizes of the toolbar and the headers, which may be one or two rows
    return this.windowHeight - 150;
  }

  onToggleVisibility(header: BoardHeader) {
    this.toggleColumnVisibility.emit(header);
  }

  onToggleBacklog(header: BoardHeader) {
    this.toggleBacklog.next(header);
  }
}
