import {List} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {BoardIssue} from '../../../model/board/issue/board-issue';
import {IssueTableVm} from './issue-table-vm';

const DEFAULT_STATE: IssueTableVm = {
  table: List<List<BoardIssue>>()
};

interface IssueTableVmRecord extends TypedRecord<IssueTableVmRecord>, IssueTableVm {
}

const STATE_FACTORY = makeTypedFactory<IssueTableVm, IssueTableVmRecord>(DEFAULT_STATE);
export const initialIssueTableVm: IssueTableVm = STATE_FACTORY(DEFAULT_STATE);

export class IssueTableVmUtil {

  static toStateRecord(s: IssueTableVm): IssueTableVmRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <IssueTableVmRecord>s;
  }

  static createIssueTableVm(tableList: List<List<BoardIssue>>) {
    const state: IssueTableVm = {
      table: tableList
    };
    return STATE_FACTORY(state);
  }
}
