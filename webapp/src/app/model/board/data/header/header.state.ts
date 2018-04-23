import {List, Map} from 'immutable';

export interface HeaderState {
  states: List<string>;
  helpTexts:  Map<string, string>;
  /** The non-backlog states only - so it is the range (backlog:states.length-1)*/
  wip: List<number>;
  /** The non-backlog states only - so it is the range (backlog:states.length-1)*/
  categories: List<string>;
  /** The non-backlog states only - so it is the range (backlog:states.length-1) */
  stateToCategoryMappings: List<number>;
  backlog: number;
}
