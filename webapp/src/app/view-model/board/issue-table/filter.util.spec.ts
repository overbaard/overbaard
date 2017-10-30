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
import {ParallelTask, ProjectState} from '../../../model/board/data/project/project.model';

describe('Apply filter tests', () => {

  describe('Issue filters', () => {
    it ('No filters', () => {
      const issue: BoardIssueVm = emptyIssue();
      expect(filtersFromQs({}).filterVisible(issue)).toBe(true);
    });

    describe('Project', () => {
      it ('Matches one', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({project: 'ISSUE'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches one out of several', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({project: 'ISSUE,TEST'}).filterVisible(issue)).toBe(true);
      });
      it ('Non match', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({project: 'TEST'}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Priority', () => {
      it ('Matches one', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({priority: 'high'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches one out of several', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({priority: 'high,low'}).filterVisible(issue)).toBe(true);
      });
      it ('Non match', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({priority: 'low'}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Issue Type', () => {
      it ('Matches one', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'issue-type': 'bug'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches one out of several', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'issue-type': 'bug,task'}).filterVisible(issue)).toBe(true);
      });
      it ('Non match', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'issue-type': 'task'}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Assignee', () => {
      it ('Matches one', () => {
        const issue: BoardIssueVm = emptyIssue();
        issue['assignee'] = <Assignee>{key: 'bob'} ;
        expect(filtersFromQs({assignee: 'bob'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches one out of several', () => {
        const issue: BoardIssueVm = emptyIssue();
        issue['assignee'] = <Assignee>{key: 'bob'} ;
        expect(filtersFromQs({assignee: 'bob,fred'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches one (no assignee)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({assignee: NONE_FILTER}).filterVisible(issue)).toBe(true);
      });
      it ('Matches one (no assignee) out of several', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({assignee: 'bob,' + NONE_FILTER}).filterVisible(issue)).toBe(true);
      });
      it ('Non Match', () => {
        const issue: BoardIssueVm = emptyIssue();
        issue['assignee'] = <Assignee>{key: 'bob'} ;
        expect(filtersFromQs({assignee: 'fred'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (no assignee)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({assignee: 'fred'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (has assignee)', () => {
        const issue: BoardIssueVm = emptyIssue();
        issue['assignee'] = <Assignee>{key: 'bob'} ;
        expect(filtersFromQs({assignee: NONE_FILTER}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Component', () => {
      it ('Matches one', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({component: 'C1'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches several', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({component: 'C1,C2'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches several but not all', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({component: 'C1,C2,C3'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches no components', () => {
        const issue: BoardIssueVm = emptyIssue();
        delete issue['components'];
        expect(filtersFromQs({component: NONE_FILTER}).filterVisible(issue)).toBe(true);
      });
      it ('Non Match (out of one)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({component: 'None'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (out of many)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({component: 'NoneA,NoneB'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (no components)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({component: NONE_FILTER}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Labels', () => {
      it ('Matches one', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({label: 'L1'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches several', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({label: 'L1,L2'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches several but not all', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({label: 'L1,L2,L3'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches no labels', () => {
        const issue: BoardIssueVm = emptyIssue();
        delete issue['labels'];
        expect(filtersFromQs({label: NONE_FILTER}).filterVisible(issue)).toBe(true);
      });
      it ('Non Match (out of one)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({label: 'None'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (out of many)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({label: 'NoneA,NoneB'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (no labels)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({label: NONE_FILTER}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Fix Versions', () => {
      it ('Matches one', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'fix-version': 'F1'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches several', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'fix-version': 'F1,F2'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches several but not all', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'fix-version': 'F1,F2,F3'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches no fix versions', () => {
        const issue: BoardIssueVm = emptyIssue();
        delete issue['fixVersions'];
        expect(filtersFromQs({'fix-version': NONE_FILTER}).filterVisible(issue)).toBe(true);
      });
      it ('Non Match (out of one)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'fix-version': 'None'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (out of many)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'fix-version': 'NoneA,NoneB'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (no fix versions)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'fix-version': NONE_FILTER}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Custom Fields', () => {
      it ('Matches one (out of one)', () => {
        const issue: BoardIssueVm = emptyIssue();
        issue.customFields = Map<string, CustomField>({1: {key: 'C1-1', value: 'One One'}});
        expect(filtersFromQs({'cf.1': 'C1-1'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches one, none (out of one)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'cf.1': NONE_FILTER}).filterVisible(issue)).toBe(true);
      });
      it ('Matches two (out of two)', () => {
        const issue: BoardIssueVm = emptyIssue();
        issue.customFields = Map<string, CustomField>({1: {key: 'C1-1', value: 'One One'}, 2: {key: 'C2-2', value: 'Two Two'}});
        expect(filtersFromQs({'cf.1': 'C1-1', 'cf.2': 'C2-2'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches two, none (out of two)', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'cf.1': NONE_FILTER, 'cf.2': NONE_FILTER}).filterVisible(issue)).toBe(true);
      });
      it ('Matches two, one none (out of two)', () => {
        const issue: BoardIssueVm = emptyIssue();
        issue.customFields = Map<string, CustomField>({1: {key: 'C1-1', value: 'One One'}});
        expect(filtersFromQs({'cf.1': 'C1-1', 'cf.2': NONE_FILTER}).filterVisible(issue)).toBe(true);
      });
      it ('Non match, one out of two', () => {
        const issue: BoardIssueVm = emptyIssue();
        issue.customFields = Map<string, CustomField>({1: {key: 'C1-1', value: 'One One'}});
        expect(filtersFromQs({'cf.1': 'C1-1', 'cf.2': 'C2-2'}).filterVisible(issue)).toBe(false);
      })
      it ('Non match, zero out of one', () => {
        const issue: BoardIssueVm = emptyIssue();
        issue.customFields = Map<string, CustomField>({1: {key: 'C1-2', value: 'One Two'}});
        expect(filtersFromQs({'cf.1': 'C1-1'}).filterVisible(issue)).toBe(false);
      })
      it ('Non match, no custom field in issue', () => {
        const issue: BoardIssueVm = emptyIssue();
        expect(filtersFromQs({'cf.1': 'C1-1'}).filterVisible(issue)).toBe(false);
      })
      it ('Non match (none)', () => {
        const issue: BoardIssueVm = emptyIssue();
        issue.customFields = Map<string, CustomField>({1: {key: 'C1-1', value: 'One One'}});
        expect(filtersFromQs({'cf.1': NONE_FILTER}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Parallel Tasks', () => {
      let projectState: ProjectState;
      const issue: BoardIssueVm = emptyIssue();
      beforeEach(() => {
        const tasks: Map<string, List<ParallelTask>> = Map<string, List<ParallelTask>>().withMutations(map => {
          const projectTasks: List<ParallelTask> = List<ParallelTask>([
            {
              name: 'Community Docs',
              display: 'CD',
              options: ['One', 'Two', 'Three']
            },
            {
              name: 'Test Development',
              display: 'TD',
              options: ['Uno', 'Dos', 'Tres']
            }
          ]);
          map.set('ISSUE', projectTasks);
        });
        projectState = {
          owner: 'ISSUE',
          boardProjects: null,
          linkedProjects: null,
          parallelTasks: tasks
        }
        issue.parallelTasks = List<string>(['One', 'Dos']);
      });
      it ('Matches one', () => {
        expect(filtersFromQs({'pt.CD': 'One'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches other', () => {
        expect(filtersFromQs({'pt.TD': 'Uno'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches both', () => {
        expect(filtersFromQs({'pt.CD': 'One', 'pt.TD': 'Uno'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches one of several', () => {
        expect(filtersFromQs({'pt.CD': 'One, Two, Three'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches other of several', () => {
        expect(filtersFromQs({'pt.TD': 'Uno, Dos, Tres'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches both of several', () => {
        expect(filtersFromQs({'pt.CD': 'One, Two, Three', 'pt.TD': 'Uno,Dos,Tres'}).filterVisible(issue)).toBe(true);
      });
      it ('Skip matching for unknown', () => {
        // Since filters are chosen for the whole board, and parallel tasks are configured per project
        // we only want to filter ones which belong to the project
        // TODO think about whether this is correct. Perhaps we should only pick ot ones which have that PT set ups
        expect(filtersFromQs({'pt.UNKNOWN': 'One'}).filterVisible(issue)).toBe(true);
      });

      it ('Non Match - one', () => {
        expect(filtersFromQs({'pt.CD': 'Two'}).filterVisible(issue)).toBe(true);
      });
      it ('Non Match - other', () => {
        expect(filtersFromQs({'pt.TD': 'Tres'}).filterVisible(issue)).toBe(true);
      });

    });
  });

  function filtersFromQs(qs: Dictionary<string>, projectState?: ProjectState): AllFilters {
    if (!projectState) {
      projectState = {
        owner: 'ISSUE',
        boardProjects: null,
        linkedProjects: null,
        parallelTasks: Map<string, List<ParallelTask>>()
      };
    }
    const boardFilters: BoardFilterState =
      boardFilterMetaReducer(initialBoardFilterState, UserSettingActions.createInitialiseFromQueryString(qs));
    return new AllFilters(boardFilters, projectState);
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
      ownState: -1,
      visible: true
    }
  }
});
