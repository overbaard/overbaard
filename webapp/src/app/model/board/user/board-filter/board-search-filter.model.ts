import {Map, Set} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

export interface BoardSearchFilterState {
  issueIds: Set<string>;
  containingText: string;
}

const DEFAULT_STATE: BoardSearchFilterState = {
  issueIds: Set<string>(),
  containingText: null
};

interface BoardSearchFilterStateRecord extends TypedRecord<BoardSearchFilterStateRecord>, BoardSearchFilterState {
}

const STATE_FACTORY = makeTypedFactory<BoardSearchFilterState, BoardSearchFilterStateRecord>(DEFAULT_STATE);
export const initialBoardSearchFilterState: BoardSearchFilterState = STATE_FACTORY(DEFAULT_STATE);

export class BoardSearchFilterUtil {
  static updateBoardSearcgFilterState(
    boardSearchFilterState: BoardSearchFilterState, mutate: (mutable: BoardSearchFilterState) => any): BoardSearchFilterState {
    return (<BoardSearchFilterStateRecord>boardSearchFilterState).withMutations(mutable => {
      return mutate(mutable);
    });
  }


  static fromObject(object: BoardSearchFilterState) {
    return STATE_FACTORY(object);
  }
}


