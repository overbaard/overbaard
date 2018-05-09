export interface UpdateParallelTaskEvent {
  issueKey: string;
  groupIndex: number;
  taskIndex: number;
  selectedOptionIndex: number;
  taskName: string;
  optionName: string;
}
