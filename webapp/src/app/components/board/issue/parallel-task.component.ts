import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {ParallelTask, ParallelTaskOption, ParallelTaskPosition} from '../../../model/board/data/project/project.model';
import {ParallelTaskSelectorComponent} from './parallel-task-selector.component';
import {BoardIssueView} from '../../../view-model/board/board-issue-view';
import {UpdateParallelTaskEvent} from '../../../events/update-parallel-task.event';

@Component({
  selector: 'app-parallel-task',
  templateUrl: './parallel-task.component.html',
  styleUrls: ['./parallel-task.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParallelTaskComponent implements OnInit {

  @Input()
  groupIndex: number;

  @Input()
  taskIndex: number;

  @Input()
  issue: BoardIssueView;

  @Output()
  updateParallelTask: EventEmitter<UpdateParallelTaskEvent> = new EventEmitter<UpdateParallelTaskEvent>();

  constructor(public parallelTaskDialog: MatDialog) {
  }

  ngOnInit(): void {
  }

  get parallelTask(): ParallelTask {
    return this.issue.parallelTasks.getIn([this.groupIndex, this.taskIndex]);
  }

  get selectedOption(): ParallelTaskOption {
    return this.parallelTask.options.get(
      this.issue.selectedParallelTasks.getIn([this.groupIndex, this.taskIndex]));
  }

  onOpenDialog(event: MouseEvent) {
    const y = window.innerHeight - event.clientY;

    const dialogRef = this.parallelTaskDialog.open(ParallelTaskSelectorComponent, {
      position: {left: event.clientX + 'px', bottom: y + 'px'},
      data: {
        task: this.parallelTask,
        option: this.selectedOption
      }
    });
    dialogRef.afterClosed().subscribe(index => {
      const option: ParallelTaskOption = this.parallelTask.options.get(index);
      if (option && option !== this.selectedOption) {
        this.updateParallelTask.emit({
          issueKey: this.issue.key,
          groupIndex: this.groupIndex,
          taskIndex: this.taskIndex,
          selectedOptionIndex: index,
          taskName: this.parallelTask.name,
          optionName: option.name
        });
      }
    });
  }
}
