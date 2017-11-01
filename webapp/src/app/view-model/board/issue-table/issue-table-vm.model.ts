import {List, Map} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {IssueTableVm, SwimlaneInfoVm} from './issue-table-vm';
import {BoardIssueVm} from './board-issue-vm';

const DEFAULT_STATE: IssueTableVm = {
  issues: Map<string, BoardIssueVm>(),
  table: List<List<string>>(),
  swimlaneInfo: null,
  visibleIssueCounts: List<number>()
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

  static createIssueTableVm(
    issues: Map<string, BoardIssueVm>,
    tableList: List<List<string>>,
    swimlaneInfo: SwimlaneInfoVm,
    visibleIssueCounts: List<number>) {

    const state: IssueTableVm = {
      issues: issues,
      table: tableList,
      swimlaneInfo: swimlaneInfo,
      visibleIssueCounts: visibleIssueCounts
    };
    return STATE_FACTORY(state);
  }
}
