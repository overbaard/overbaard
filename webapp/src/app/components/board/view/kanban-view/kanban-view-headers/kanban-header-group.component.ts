import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BoardHeader} from '../../../../../view-model/board/board-header';

@Component({
  selector: 'app-kanban-header-group',
  templateUrl: './kanban-header-group.component.html',
  styleUrls: ['./kanban-header-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanHeaderGroupComponent implements OnInit {

  @Input()
  header: BoardHeader;

  @Output()
  toggleColumnVisibility: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  @Output()
  toggleBacklog: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  classList: string[];
  showStates = true;

  constructor() { }

  ngOnInit() {
    if (this.header.backlog) {
      if (this.header.visible) {
        this.classList = ['backlog']
      } else {
        this.classList = ['backlog', 'hidden-backlog']
      }
    }

    if (!this.header.category) {
      this.showStates = false;
    } else if (this.header.backlog && !this.header.visible) {
      this.showStates = false;
    }
  }

  onToggleVisibility(header: BoardHeader) {
    if (!header.backlog) {
      this.toggleColumnVisibility.next(header);
    } else {
      if (header.category) {
        this.toggleBacklog.next(header);
      } else {
        // For the backlog, the non-category states will not be visible if the backlog is collapsed, so
        // this header must have been visible
        // If all the other (or there are no other) indices are false, we need to toggle the backlog
        let otherTrue = false;
        const backlogCategory: BoardHeader = this.header;
        backlogCategory.states.forEach(state => {
          if (state !== header) {
            if (state.visible === true) {
              otherTrue = true;
            }
          }
        });
        if (!otherTrue) {
          this.toggleBacklog.emit(backlogCategory);
        } else {
          this.toggleColumnVisibility.emit(header);
        }
      }
    }
  }
}
