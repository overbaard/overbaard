import {Map, Set} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

export interface BoardFilterState {
  project: Set<string>;
  priority: Set<string>;
  issueType: Set<string>;
  assignee: Set<string>;
  component: Set<string>;
  label: Set<string>;
  fixVersion: Set<string>;
  customField: Map<string, Set<string>>;
  parallelTask: Map<string, Set<string>>;
}

const DEFAULT_STATE: BoardFilterState = {
  project: Set<string>(),
  priority: Set<string>(),
  issueType: Set<string>(),
  assignee: Set<string>(),
  component: Set<string>(),
  label: Set<string>(),
  fixVersion: Set<string>(),
  customField: Map<string, Set<string>>(),
  parallelTask: Map<string, Set<string>>()
}

interface BoardFilterStateRecord extends TypedRecord<BoardFilterStateRecord>, BoardFilterState {
}

const STATE_FACTORY = makeTypedFactory<BoardFilterState, BoardFilterStateRecord>(DEFAULT_STATE);
export const initialBoardFilterState: BoardFilterState = STATE_FACTORY(DEFAULT_STATE);

export class BoardFilterUtil {
  static toStateRecord(s: BoardFilterState): BoardFilterStateRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <BoardFilterStateRecord>s;
  }

  static fromObject(object: BoardFilterState) {
    return STATE_FACTORY(object);
  }
}
