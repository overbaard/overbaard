import {boardFilterMetaReducer} from '../../model/board/user/board-filter/board-filter.reducer';
import {BoardFilterState, initialBoardFilterState} from '../../model/board/user/board-filter/board-filter.model';
import {UserSettingActions} from '../../model/board/user/user-setting.reducer';
import {Dictionary} from '../../common/dictionary';
import {BoardIssueView} from './board-issue-view';
import {Assignee, NO_ASSIGNEE} from '../../model/board/data/assignee/assignee.model';
import {List, Map, OrderedSet} from 'immutable';
import {CustomField} from '../../model/board/data/custom-field/custom-field.model';
import {AllFilters} from './filter.util';
import {CURRENT_USER_FILTER_KEY, NONE_FILTER_KEY} from '../../model/board/user/board-filter/board-filter.constants';
import {ParallelTask, ProjectState} from '../../model/board/data/project/project.model';
import {LinkedIssue} from '../../model/board/data/issue/linked-issue';

describe('Apply filter tests', () => {

  describe('Issue filters', () => {
    it ('No filters', () => {
      const issue: BoardIssueView = emptyIssue();
      expect(filtersFromQs({}).filterVisible(issue)).toBe(true);
    });

    describe('Project', () => {
      it ('Matches one', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({project: 'ISSUE'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches one out of several', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({project: 'ISSUE,TEST'}).filterVisible(issue)).toBe(true);
      });
      it ('Non match', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({project: 'TEST'}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Priority', () => {
      it ('Matches one', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({priority: 'high'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches one out of several', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({priority: 'high,low'}).filterVisible(issue)).toBe(true);
      });
      it ('Non match', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({priority: 'low'}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Issue Type', () => {
      it ('Matches one', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'issue-type': 'bug'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches one out of several', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'issue-type': 'bug,task'}).filterVisible(issue)).toBe(true);
      });
      it ('Non match', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'issue-type': 'task'}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Assignee', () => {
      it ('Matches one', () => {
        const issue: BoardIssueView = emptyIssue();
        issue['assignee'] = <Assignee>{key: 'bob'} ;
        expect(filtersFromQs({assignee: 'bob'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches one out of several', () => {
        const issue: BoardIssueView = emptyIssue();
        issue['assignee'] = <Assignee>{key: 'bob'} ;
        expect(filtersFromQs({assignee: 'bob,fred'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches one (no assignee)', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({assignee: NONE_FILTER_KEY}).filterVisible(issue)).toBe(true);
      });
      it ('Matches one (no assignee) out of several', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({assignee: 'bob,' + NONE_FILTER_KEY}).filterVisible(issue)).toBe(true);
      });
      it ('Non Match', () => {
        const issue: BoardIssueView = emptyIssue();
        issue['assignee'] = <Assignee>{key: 'bob'} ;
        expect(filtersFromQs({assignee: 'fred'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (no assignee)', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({assignee: 'fred'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (has assignee)', () => {
        const issue: BoardIssueView = emptyIssue();
        issue['assignee'] = <Assignee>{key: 'bob'} ;
        expect(filtersFromQs({assignee: NONE_FILTER_KEY}).filterVisible(issue)).toBe(false);
      });

      describe('Current User', () => {
        it ('Matches current user', () => {
          const issue: BoardIssueView = emptyIssue();
          issue['assignee'] = <Assignee>{key: 'bob'};
          expect(filtersFromQs({assignee: CURRENT_USER_FILTER_KEY}, 'bob').filterVisible(issue)).toBe(true);
        });
        it ('Does not match current user', () => {
          const issue: BoardIssueView = emptyIssue();
          issue['assignee'] = <Assignee>{key: 'bob'};
          expect(filtersFromQs({assignee: CURRENT_USER_FILTER_KEY}, 'rob').filterVisible(issue)).toBe(false);
        });
        it ('Matches current user and explicit filter', () => {
          const issue: BoardIssueView = emptyIssue();
          issue['assignee'] = <Assignee>{key: 'bob'};
          expect(filtersFromQs({assignee: CURRENT_USER_FILTER_KEY + ',bob'}, 'bob').filterVisible(issue)).toBe(true);
        });
        it ('Does not match current user but matches explicit filter', () => {
          const issue: BoardIssueView = emptyIssue();
          issue['assignee'] = <Assignee>{key: 'bob'};
          expect(filtersFromQs({assignee: CURRENT_USER_FILTER_KEY + ',bob'}, 'rob').filterVisible(issue)).toBe(true);
        });
      });
    });
    describe('Component', () => {
      it ('Matches one', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({component: 'C1'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches several', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({component: 'C1,C2'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches several but not all', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({component: 'C1,C2,C3'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches no components', () => {
        const issue: BoardIssueView = emptyIssue();
        delete issue['components'];
        expect(filtersFromQs({component: NONE_FILTER_KEY}).filterVisible(issue)).toBe(true);
      });
      it ('Non Match (out of one)', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({component: 'None'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (out of many)', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({component: 'NoneA,NoneB'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (no components)', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({component: NONE_FILTER_KEY}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Labels', () => {
      it ('Matches one', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({label: 'L1'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches several', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({label: 'L1,L2'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches several but not all', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({label: 'L1,L2,L3'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches no labels', () => {
        const issue: BoardIssueView = emptyIssue();
        delete issue['labels'];
        expect(filtersFromQs({label: NONE_FILTER_KEY}).filterVisible(issue)).toBe(true);
      });
      it ('Non Match (out of one)', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({label: 'None'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (out of many)', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({label: 'NoneA,NoneB'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (no labels)', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({label: NONE_FILTER_KEY}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Fix Versions', () => {
      it ('Matches one', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'fix-version': 'F1'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches several', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'fix-version': 'F1,F2'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches several but not all', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'fix-version': 'F1,F2,F3'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches no fix versions', () => {
        const issue: BoardIssueView = emptyIssue();
        delete issue['fixVersions'];
        expect(filtersFromQs({'fix-version': NONE_FILTER_KEY}).filterVisible(issue)).toBe(true);
      });
      it ('Non Match (out of one)', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'fix-version': 'None'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (out of many)', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'fix-version': 'NoneA,NoneB'}).filterVisible(issue)).toBe(false);
      });
      it ('Non Match (no fix versions)', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'fix-version': NONE_FILTER_KEY}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Custom Fields', () => {
      it ('Matches one (out of one)', () => {
        const issue: BoardIssueView = emptyIssue();
        issue.customFields = Map<string, CustomField>({1: {key: 'C1-1', value: 'One One'}});
        expect(filtersFromQs({'cf.1': 'C1-1'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches one, none (out of one)', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'cf.1': NONE_FILTER_KEY}).filterVisible(issue)).toBe(true);
      });
      it ('Matches two (out of two)', () => {
        const issue: BoardIssueView = emptyIssue();
        issue.customFields = Map<string, CustomField>({1: {key: 'C1-1', value: 'One One'}, 2: {key: 'C2-2', value: 'Two Two'}});
        expect(filtersFromQs({'cf.1': 'C1-1', 'cf.2': 'C2-2'}).filterVisible(issue)).toBe(true);
      });
      it ('Matches two, none (out of two)', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'cf.1': NONE_FILTER_KEY, 'cf.2': NONE_FILTER_KEY}).filterVisible(issue)).toBe(true);
      });
      it ('Matches two, one none (out of two)', () => {
        const issue: BoardIssueView = emptyIssue();
        issue.customFields = Map<string, CustomField>({1: {key: 'C1-1', value: 'One One'}});
        expect(filtersFromQs({'cf.1': 'C1-1', 'cf.2': NONE_FILTER_KEY}).filterVisible(issue)).toBe(true);
      });
      it ('Non match, one out of two', () => {
        const issue: BoardIssueView = emptyIssue();
        issue.customFields = Map<string, CustomField>({1: {key: 'C1-1', value: 'One One'}});
        expect(filtersFromQs({'cf.1': 'C1-1', 'cf.2': 'C2-2'}).filterVisible(issue)).toBe(false);
      })
      it ('Non match, zero out of one', () => {
        const issue: BoardIssueView = emptyIssue();
        issue.customFields = Map<string, CustomField>({1: {key: 'C1-2', value: 'One Two'}});
        expect(filtersFromQs({'cf.1': 'C1-1'}).filterVisible(issue)).toBe(false);
      })
      it ('Non match, no custom field in issue', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'cf.1': 'C1-1'}).filterVisible(issue)).toBe(false);
      })
      it ('Non match (none)', () => {
        const issue: BoardIssueView = emptyIssue();
        issue.customFields = Map<string, CustomField>({1: {key: 'C1-1', value: 'One One'}});
        expect(filtersFromQs({'cf.1': NONE_FILTER_KEY}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Parallel Tasks', () => {
      let projectState: ProjectState;
      const issue: BoardIssueView = emptyIssue();
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
        issue.selectedParallelTasks = List<number>([0, 1]);
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

  function filtersFromQs(qs: Dictionary<string>, currentUser?: string): AllFilters {
    const projectState = {
        owner: 'ISSUE',
        boardProjects: null,
        linkedProjects: null,
        parallelTasks: Map<string, List<ParallelTask>>()
      };

    const boardFilters: BoardFilterState =
      boardFilterMetaReducer(initialBoardFilterState, UserSettingActions.createInitialiseFromQueryString(qs));
    return new AllFilters(boardFilters, projectState, currentUser);
  }

  function emptyIssue(): BoardIssueView {
    return {
      key: 'ISSUE-1',
      projectCode: 'ISSUE',
      priority: {name: 'high', colour: null},
      type: {name: 'bug', colour: null},
      summary: 'Hello',
      assignee: NO_ASSIGNEE,
      components: OrderedSet<string>(['C1', 'C2']),
      labels: OrderedSet<string>(['L1', 'L2']),
      fixVersions: OrderedSet<string>(['F1', 'F2']),
      customFields: Map<string, CustomField>(),
      parallelTasks: null,
      selectedParallelTasks: null,
      linkedIssues: List<LinkedIssue>(),
      ownState: -1,
      visible: true,
      projectColour: 'red',
      issueUrl: null,
      ownStateName: null,
      calculatedTotalHeight: 0,
      summaryLines: List<string>()
    }
  }
});
