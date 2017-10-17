import {boardFilterMetaReducer} from '../../../model/board/user/board-filter/board-filter.reducer';
import {BoardFilterState, initialBoardFilterState} from '../../../model/board/user/board-filter/board-filter.model';
import {UserSettingActions} from '../../../model/board/user/user-setting.reducer';
import {Dictionary} from '../../../common/dictionary';
import {BoardIssueVm} from './board-issue-vm';
import {Assignee, NO_ASSIGNEE} from '../../../model/board/data/assignee/assignee.model';
import {List, Map, OrderedSet} from 'immutable';
import {CustomField} from '../../../model/board/data/custom-field/custom-field.model';
import {Issue} from '../../../model/board/data/issue/issue';
import {AllFilters} from './filter.util';
import {NONE_FILTER} from '../../../model/board/user/board-filter/board-filter.constants';

describe('Apply filter tests', () => {

  describe('Issue filters', () => {
    it ('No filters', () => {
      const issue: BoardIssueVm = emptyIssue();
      expect(filtersFromQs({}).filter(issue)).toBe(false);
    });

    describe('Project', () => {
      it ('Matches one', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({project: 'ISSUE'}).filter(issue)).toBe(false);
      });
      it ('Matches one out of several', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({project: 'ISSUE,TEST'}).filter(issue)).toBe(false);
      });
      it ('Non match', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({project: 'TEST'}).filter(issue)).toBe(true);
      });
    });
    describe('Priority', () => {
      it ('Matches one', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({priority: 'high'}).filter(issue)).toBe(false);
      });
      it ('Matches one out of several', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({priority: 'high,low'}).filter(issue)).toBe(false);
      });
      it ('Non match', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({priority: 'low'}).filter(issue)).toBe(true);
      });
    });
    describe('Issue Type', () => {
      it ('Matches one', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'issue-type': 'bug'}).filter(issue)).toBe(false);
      });
      it ('Matches one out of several', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'issue-type': 'bug,task'}).filter(issue)).toBe(false);
      });
      it ('Non match', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'issue-type': 'task'}).filter(issue)).toBe(true);
      });
    });
    describe('Assignee', () => {
      it ('Matches one', () => {
        const issue: BoardIssueVm = emptyIssue();
        issue['assignee'] = <Assignee>{key: 'bob'} ;
        expect(filtersFromQs({assignee: 'bob'}).filter(issue)).toBe(false);
      });
      it ('Matches one out of several', () => {
        const issue: BoardIssueVm = emptyIssue();
        issue['assignee'] = <Assignee>{key: 'bob'} ;
        expect(filtersFromQs({assignee: 'bob,fred'}).filter(issue)).toBe(false);
      });
      it ('Non Match', () => {
        const issue: BoardIssueVm = emptyIssue();
        issue['assignee'] = <Assignee>{key: 'bob'} ;
        expect(filtersFromQs({assignee: 'fred'}).filter(issue)).toBe(true);
      });
      it ('Matches one (no assignee)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({assignee: NONE_FILTER}).filter(issue)).toBe(false);
      });
      it ('Matches one (no assignee) out of several', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({assignee: 'bob,' + NONE_FILTER}).filter(issue)).toBe(false);
      });
      it ('Non Match (no assignee)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({assignee: 'fred'}).filter(issue)).toBe(true);
      });
    });
    describe('Component', () => {
      it ('Matches one', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({component: 'C1'}).filter(issue)).toBe(false);
      });
      it ('Matches several', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({component: 'C1,C2'}).filter(issue)).toBe(false);
      });
      it ('Matches several but not all', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({component: 'C1,C2,C3'}).filter(issue)).toBe(false);
      });
      it ('Matches no components', () => {
        const issue: BoardIssueVm = emptyIssue();
        delete issue['components'];
        expect(filtersFromQs({component: NONE_FILTER}).filter(issue)).toBe(false);
      });
      it ('Non Match (out of one)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({component: 'None'}).filter(issue)).toBe(true);
      });
      it ('Non Match (out of many)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({component: 'NoneA,NoneB'}).filter(issue)).toBe(true);
      });
      it ('Non Match (no components)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({component: NONE_FILTER}).filter(issue)).toBe(true);
      });
    });
    describe('Labels', () => {
      it ('Matches one', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({label: 'L1'}).filter(issue)).toBe(false);
      });
      it ('Matches several', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({label: 'L1,L2'}).filter(issue)).toBe(false);
      });
      it ('Matches several but not all', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({label: 'L1,L2,L3'}).filter(issue)).toBe(false);
      });
      it ('Matches no labels', () => {
        const issue: BoardIssueVm = emptyIssue();
        delete issue['labels'];
        expect(filtersFromQs({label: NONE_FILTER}).filter(issue)).toBe(false);
      });
      it ('Non Match (out of one)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({label: 'None'}).filter(issue)).toBe(true);
      });
      it ('Non Match (out of many)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({label: 'NoneA,NoneB'}).filter(issue)).toBe(true);
      });
      it ('Non Match (no labels)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({label: NONE_FILTER}).filter(issue)).toBe(true);
      });
    });
    describe('Fix Versions', () => {
      it ('Matches one', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'fix-version': 'F1'}).filter(issue)).toBe(false);
      });
      it ('Matches several', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'fix-version': 'F1,F2'}).filter(issue)).toBe(false);
      });
      it ('Matches several but not all', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'fix-version': 'F1,F2,F3'}).filter(issue)).toBe(false);
      });
      it ('Matches no fix versions', () => {
        const issue: BoardIssueVm = emptyIssue();
        delete issue['fixVersions'];
        expect(filtersFromQs({'fix-version': NONE_FILTER}).filter(issue)).toBe(false);
      });
      it ('Non Match (out of one)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'fix-version': 'None'}).filter(issue)).toBe(true);
      });
      it ('Non Match (out of many)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'fix-version': 'NoneA,NoneB'}).filter(issue)).toBe(true);
      });
      it ('Non Match (no fix versions)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'fix-version': NONE_FILTER}).filter(issue)).toBe(true);
      });
    });
  });


  function filtersFromQs(qs: Dictionary<string>): AllFilters {
    const boardFilters: BoardFilterState =
      boardFilterMetaReducer(initialBoardFilterState, UserSettingActions.createInitialiseFromQueryString(qs));
    return new AllFilters(boardFilters);
  }

  function emptyIssue(): BoardIssueVm {
    return {
      key: 'ISSUE-1',
      projectCode: 'ISSUE',
      priority: {name: 'high', icon: null},
      type: {name: 'bug', icon: null},
      summary: 'Hello',
      assignee: NO_ASSIGNEE,
      components: OrderedSet<string>(['C1', 'C2']),
      labels: OrderedSet<string>(['L1', 'L2']),
      fixVersions: OrderedSet<string>(['F1', 'F2']),
      customFields: Map<string, CustomField>(),
      parallelTasks: null,
      linkedIssues: List<Issue>(),
      ownState: -1
    }
  }
});
