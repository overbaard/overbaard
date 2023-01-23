import {ChangeDetectionStrategy, Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {ParallelTask, ParallelTaskOption} from '../../../model/board/data/project/project.model';

@Component({
  selector: 'app-parallel-task-selector',
  templateUrl: './parallel-task-selector.component.html',
  styleUrls: ['./parallel-task-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParallelTaskSelectorComponent implements OnInit {

  parallelTask: ParallelTask;
  issueOption: ParallelTaskOption;

  selectedOptionIndex: number;
  selectedOption: ParallelTaskOption;


  constructor(
    public dialogRef: MatDialogRef<ParallelTaskSelectorComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.parallelTask = data['task'];
    this.issueOption = data['option'];
  }

  ngOnInit(): void {

  }

  get option(): ParallelTaskOption {
    if (!this.selectedOption) {
      return this.issueOption;
    }
    return this.selectedOption;
  }

  onOverOption(optionIndex: number) {
    this.selectedOption = optionIndex >= 0 ? this.parallelTask.options.get(optionIndex) : null;
    this.selectedOptionIndex = optionIndex;
  }

  onSelectOption(optionIndex: number) {
    this.dialogRef.close(optionIndex);
  }
}
