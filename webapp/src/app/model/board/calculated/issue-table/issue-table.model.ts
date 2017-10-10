import {List} from 'immutable';
import {BoardIssue} from '../../issue/board-issue';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

export interface IssueTableState {
  table: List<List<BoardIssue>>;
}


const DEFAULT_STATE: IssueTableState = {
  table: List<List<BoardIssue>>()
};

interface IssueTableStateRecord extends TypedRecord<IssueTableStateRecord>, IssueTableState {
}

const STATE_FACTORY = makeTypedFactory<IssueTableState, IssueTableStateRecord>(DEFAULT_STATE);
export const initialIssueTableState: IssueTableState = STATE_FACTORY(DEFAULT_STATE);

export class IssueTableUtil {

  static toStateRecord(s: IssueTableState): IssueTableStateRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <IssueTableStateRecord>s;
  }

  static createIssueTableState(tableList: List<List<BoardIssue>>) {
    const state: IssueTableState = {
      table: tableList
    };
    return STATE_FACTORY(state);
  }
}
