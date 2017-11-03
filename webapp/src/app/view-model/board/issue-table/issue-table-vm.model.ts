import {List, Map, OrderedMap} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {IssueTableVm, SwimlaneDataVm, SwimlaneInfoVm} from './issue-table-vm';
import {BoardIssueVm} from './board-issue-vm';

const DEFAULT_ISSUE_STATE: IssueTableVm = {
  issues: Map<string, BoardIssueVm>(),
  table: List<List<string>>(),
  swimlaneInfo: null,
  visibleIssueCounts: List<number>()
};

const DEFAULT_SWIMLANE_INFO_STATE: SwimlaneInfoVm = {
  swimlanes: OrderedMap<string, SwimlaneDataVm>()
};

const DEFAULT_SWIMLANE_DATA_STATE: SwimlaneDataVm = {
  key: null,
  display: null,
  table: List<List<string>>(),
  visibleIssues: 0
};

interface IssueTableVmRecord extends TypedRecord<IssueTableVmRecord>, IssueTableVm {
}

interface SwimlaneInfoVmRecord extends TypedRecord<SwimlaneInfoVmRecord>, SwimlaneInfoVm {
}

interface SwimlaneDataVmRecord extends TypedRecord<SwimlaneDataVmRecord>, SwimlaneDataVm {
}

const ISSUE_TABLE_STATE_FACTORY = makeTypedFactory<IssueTableVm, IssueTableVmRecord>(DEFAULT_ISSUE_STATE);
const SWIMLANE_INFO_STATE_FACTORY = makeTypedFactory<SwimlaneInfoVm, SwimlaneInfoVmRecord>(DEFAULT_SWIMLANE_INFO_STATE);
const SWIMLANE_DATA_STATE_FACTORY = makeTypedFactory<SwimlaneDataVm, SwimlaneDataVmRecord>(DEFAULT_SWIMLANE_DATA_STATE);

export const initialIssueTableVm: IssueTableVm = ISSUE_TABLE_STATE_FACTORY(DEFAULT_ISSUE_STATE);

export class IssueTableVmUtil {

  static toStateRecord(s: IssueTableVm): IssueTableVmRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <IssueTableVmRecord>s;
  }

  static createIssueTableVm(
    issues: Map<string, BoardIssueVm>,
    tableList: List<List<string>>,
    swimlaneInfo: SwimlaneInfoVm,
    visibleIssueCounts: List<number>): IssueTableVm {

    const state: IssueTableVm = {
      issues: issues,
      table: tableList,
      swimlaneInfo: swimlaneInfo,
      visibleIssueCounts: visibleIssueCounts
    };
    return ISSUE_TABLE_STATE_FACTORY(state);
  }

  static createSwimlaneDataVm(
    key: string,
    display: string,
    table: List<List<string>>,
    visibleIssues: number): SwimlaneDataVm {
    const state: SwimlaneDataVm = {
      key: key,
      display: display,
      table: table,
      visibleIssues: visibleIssues
    }
    return SWIMLANE_DATA_STATE_FACTORY(state);
  }

  static createSwimlaneInfoVm(swimlanes: OrderedMap<string, SwimlaneDataVm>) {
    const state: SwimlaneInfoVm = {
      swimlanes: swimlanes
    }
    return SWIMLANE_INFO_STATE_FACTORY(state);
  }
}
