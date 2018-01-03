import {List} from 'immutable';

export interface BoardHeader {
  name: string;
  abbreviation: string;
  backlog: boolean;
  category: boolean;
  stateIndices: List<number>;
  wip: number;
  states?: List<BoardHeader>;
  visible: boolean;
  totalIssues: number;
  visibleIssues: number;
  helpText: string;
}
