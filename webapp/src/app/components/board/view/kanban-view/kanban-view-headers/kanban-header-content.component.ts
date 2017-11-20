import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BoardHeader} from '../../../../../view-model/board/board-header';

@Component({
  selector: 'app-kanban-header-content',
  templateUrl: './kanban-header-content.component.html',
  styleUrls: ['./kanban-header-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanHeaderContentComponent implements OnInit {

  @Input()
  header: BoardHeader;

  @Output()
  toggleColumnVisibility: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  classList: string[];

  constructor() { }

  ngOnInit() {
    if (!this.header.category) {
      if (this.header.visible) {
        this.classList = ['state', 'visible'];
      } else {
        this.classList = ['state', 'invisible'];
      }
    }
  }

  onToggleVisibility(header: BoardHeader) {
    this.toggleColumnVisibility.emit(header);
  }
}
