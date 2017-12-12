import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChange, SimpleChanges} from '@angular/core';
import {List, Map} from 'immutable';
import {BoardIssueView} from '../../../../../view-model/board/board-issue-view';
import {IssueTable} from '../../../../../view-model/board/issue-table';
import {BoardHeader} from '../../../../../view-model/board/board-header';

@Component({
  selector: 'app-kanban-view-column',
  templateUrl: './kanban-view-column.component.html',
  styleUrls: ['./kanban-view-column.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KanbanViewColumnComponent implements OnInit, OnChanges {

  @Input()
  header: BoardHeader;

  @Input()
  issues: Map<string, BoardIssueView>;

  @Input()
  issueKeys: List<string>;

  // If a swimlane is collapsed, we still need to display empty columns so the header has the correct width
  @Input()
  displayIssues = true;

  classList: string[];

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['header']) {
      const change: SimpleChange = changes['header'];
      if (change.isFirstChange() || change.previousValue.visible !== change.currentValue.visible) {
        if (this.header.visible) {
          this.classList = ['column', 'visible'];
        } else {
          this.classList = ['column', 'invisible'];
        }
      }
    }
  }

  // trackBy is a hint to angular to be able to keep (i.e. don't destroy and recreate) as many components as possible
  issueTrackByFn(index: number, key: string) {
    return key;
  }

}
