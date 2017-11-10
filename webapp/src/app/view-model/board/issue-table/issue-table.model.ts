import {List, Map, OrderedMap} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {IssueTable, SwimlaneData, SwimlaneInfo} from './issue-table';
import {BoardIssueView} from './board-issue-view';

const DEFAULT_ISSUE_STATE: IssueTable = {
  showBacklog: false,
  backlogStates: List<number>(),
  normalStates: List<number>(),
  issues: Map<string, BoardIssueView>(),
  table: List<List<string>>(),
  swimlaneInfo: null,
  visibleIssueCounts: List<number>(),
  visibleColumns: List<boolean>()
};

const DEFAULT_SWIMLANE_INFO_STATE: SwimlaneInfo = {
  swimlanes: OrderedMap<string, SwimlaneData>()
};

const DEFAULT_SWIMLANE_DATA_STATE: SwimlaneData = {
  key: null,
  display: null,
  table: List<List<string>>(),
  visibleIssues: 0,
  filterVisible: true
};

interface IssueTableRecord extends TypedRecord<IssueTableRecord>, IssueTable {
}

interface SwimlaneInfoRecord extends TypedRecord<SwimlaneInfoRecord>, SwimlaneInfo {
}

interface SwimlaneDataRecord extends TypedRecord<SwimlaneDataRecord>, SwimlaneData {
}

const ISSUE_TABLE_STATE_FACTORY = makeTypedFactory<IssueTable, IssueTableRecord>(DEFAULT_ISSUE_STATE);
const SWIMLANE_INFO_STATE_FACTORY = makeTypedFactory<SwimlaneInfo, SwimlaneInfoRecord>(DEFAULT_SWIMLANE_INFO_STATE);
const SWIMLANE_DATA_STATE_FACTORY = makeTypedFactory<SwimlaneData, SwimlaneDataRecord>(DEFAULT_SWIMLANE_DATA_STATE);

export const initialIssueTable: IssueTable = ISSUE_TABLE_STATE_FACTORY(DEFAULT_ISSUE_STATE);

export class IssueTableUtil {

  static toStateRecord(s: IssueTable): IssueTableRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <IssueTableRecord>s;
  }

  static createIssueTable(
    showBacklog: boolean,
    backlogStates: List<number>,
    normalStates: List<number>,
    issues: Map<string, BoardIssueView>,
    tableList: List<List<string>>,
    swimlaneInfo: SwimlaneInfo,
    visibleIssueCounts: List<number>,
    visibleColumns: List<boolean>): IssueTable {

    const state: IssueTable = {
      showBacklog: showBacklog,
      backlogStates: backlogStates,
      normalStates: normalStates,
      issues: issues,
      table: tableList,
      swimlaneInfo: swimlaneInfo,
      visibleIssueCounts: visibleIssueCounts,
      visibleColumns: visibleColumns
    };
    return ISSUE_TABLE_STATE_FACTORY(state);
  }

  static createSwimlaneDataView(
    key: string,
    display: string,
    table: List<List<string>>,
    visibleIssues: number,
    filterVisible: boolean): SwimlaneData {
    const state: SwimlaneData = {
      key: key,
      display: display,
      table: table,
      visibleIssues: visibleIssues,
      filterVisible: filterVisible
    }
    return SWIMLANE_DATA_STATE_FACTORY(state);
  }

  static createSwimlaneInfoView(swimlanes: OrderedMap<string, SwimlaneData>) {
    const state: SwimlaneInfo = {
      swimlanes: swimlanes
    }
    return SWIMLANE_INFO_STATE_FACTORY(state);
  }
}
