import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output,
  SimpleChanges
} from '@angular/core';
import {SwimlaneData} from '../../../../../view-model/board/swimlane-data';
import {BoardViewModel} from '../../../../../view-model/board/board-view';

@Component({
  selector: 'app-kanban-swimlane-entry',
  templateUrl: './kanban-swimlane-entry.component.html',
  styleUrls: ['./kanban-swimlane-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanSwimlaneEntryComponent implements OnInit, OnChanges {

  @Input()
  board: BoardViewModel

  @Input()
  showEmpty: boolean;

  @Input()
  swimlane: SwimlaneData;

  @Output()
  toggleCollapsedSwimlane: EventEmitter<string> = new EventEmitter<string>();

  visible: boolean;

  classObj: Object = {'header-colour': true};

  constructor() {
  }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.visible = true;
    if (!this.swimlane.filterVisible) {
      this.visible = false;
    } else if (!this.showEmpty && this.swimlane.visibleIssues === 0) {
      this.visible = false;
    }
  }

// trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  columnTrackByFn(index: number, key: string) {
    return index;
  }

  onToggleCollapsedSwimlane(event: MouseEvent, key: string) {
    this.toggleCollapsedSwimlane.emit(key);
  }

  onMouseEnter() {
    this.classObj['header-colour'] = false;
    this.classObj['header-colour-hover'] = true;
  }

  onMouseLeave() {
    this.classObj['header-colour'] = true;
    this.classObj['header-colour-hover'] = false;
  }
}
