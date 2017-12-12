import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChange, SimpleChanges} from '@angular/core';
import {BoardIssueView} from '../../../view-model/board/board-issue-view';
import {Assignee, NO_ASSIGNEE} from '../../../model/board/data/assignee/assignee.model';
import {Set} from 'immutable';

@Component({
  selector: 'app-board-issue',
  templateUrl: './board-issue.component.html',
  styleUrls: ['./board-issue.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardIssueComponent implements OnInit, OnChanges {

  readonly noAssignee: Assignee = NO_ASSIGNEE;
  @Input()
  issue: BoardIssueView;

  cardTooltip: string;

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    const issue: SimpleChange = changes['issue'];
    if (issue && issue.currentValue !== issue.previousValue) {
      this.cardTooltip = null;
    }
  }

  calculateTooltips() {
    if (!this.cardTooltip) {
      let tooltip =
        `${this.issue.key}

        Assignee: ${this.issue.assignee.name}
        Priority: ${this.issue.priority.name}
        Type: ${this.issue.type.name}
        Components: ${this.formatPossiblyEmptySet(this.issue.components)}
        Labels: ${this.formatPossiblyEmptySet(this.issue.labels)}
        Fix versions: ${this.formatPossiblyEmptySet(this.issue.fixVersions)}
        `;

      if (this.issue.customFields) {
        this.issue.customFields.forEach((cf, k) => {
          tooltip +=
            `${k}: ${cf.value}
            `;
        });
      }

      // TODO Parallel tasks

      this.cardTooltip = tooltip;
    }
  }

  private formatPossiblyEmptySet(set: Set<string>): string {
    if (!set || set.size === 0) {
      return '-';
    }
    let s = ' ';
    let first = true;
    set.forEach(v => {
      if (first) {
        first = false;
      } else {
        s += ', ';
      }
      s += v;
    });
    return s;
  }

  getSelectedParallelTaskColour(index: number): string {
    const optionIndex: number = this.issue.selectedParallelTasks.get(index);
    return this.issue.parallelTasks.get(index).options.get(optionIndex).colour;
  }
}
