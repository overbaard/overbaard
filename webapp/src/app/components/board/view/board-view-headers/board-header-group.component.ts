import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BoardHeader} from '../../../../view-model/board/board-header';
import {BoardViewMode} from '../../../../model/board/user/board-view-mode';

@Component({
  selector: 'app-board-header-group',
  templateUrl: './board-header-group.component.html',
  styleUrls: ['./board-header-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardHeaderGroupComponent implements OnInit {

  @Input()
  header: BoardHeader;

  @Input()
  viewMode: BoardViewMode;

  @Output()
  toggleColumnVisibility: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  @Output()
  toggleBacklog: EventEmitter<BoardHeader> = new EventEmitter<BoardHeader>();

  showStates = true;

  classObj: Object = {};
  isHovering: boolean;

  constructor() { }

  ngOnInit() {
    if (!this.header.category) {
      this.showStates = false;
    } else if (this.header.backlog) {
      if (this.viewMode === BoardViewMode.KANBAN) {
        this.showStates = this.header.visible && this.header.stateIndices.size > 1;
      } else {
          this.showStates = this.header.stateIndices.size > 1;
      }
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

  @Input()
  set hovering(hovering: boolean) {
    if (hovering) {
      this.classObj[this.header.backlog ? 'hover-colour-backlog' : 'hover-colour'] = true;
    } else {
      this.classObj['hover-colour-backlog'] = false;
      this.classObj['hover-colour'] = false;
    }
    this.isHovering = hovering;
  }

  onMouseEnter(event: MouseEvent) {
    if (!this.showStates) {
      console.log('Setting hovering to true');
      this.hovering = true;
    }
  }

  onMouseLeave(event: MouseEvent) {
    console.log('Setting hovering to false');
    this.hovering = false;
  }
}
