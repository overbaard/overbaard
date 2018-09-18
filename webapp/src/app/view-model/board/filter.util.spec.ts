import {boardFilterMetaReducer} from '../../model/board/user/board-filter/board-filter.reducer';
import {BoardFilterState, initialBoardFilterState} from '../../model/board/user/board-filter/board-filter.model';
import {UserSettingActions} from '../../model/board/user/user-setting.reducer';
import {Dictionary} from '../../common/dictionary';
import {BoardIssueView} from './board-issue-view';
import {Assignee, NO_ASSIGNEE} from '../../model/board/data/assignee/assignee.model';
import {List, Map, OrderedMap, OrderedSet} from 'immutable';
import {CustomField} from '../../model/board/data/custom-field/custom-field.model';
import {AllFilters} from './filter.util';
import {CURRENT_USER_FILTER_KEY, NONE_FILTER_KEY} from '../../model/board/user/board-filter/board-filter.constants';
import {
  BoardProject,
  EMPTY_PARALLEL_TASK_OVERRIDE,
  ParallelTask,
  ParallelTaskOption,
  ProjectState
} from '../../model/board/data/project/project.model';
import {LinkedIssue} from '../../model/board/data/issue/linked-issue';
import {BoardSearchFilterState, initialBoardSearchFilterState} from '../../model/board/user/board-filter/board-search-filter.model';
import {boardSearchFilterMetaReducer} from '../../model/board/user/board-filter/board-search-filter.reducer';
import {Action} from '@ngrx/store';

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
      });
      it ('Non match, zero out of one', () => {
        const issue: BoardIssueView = emptyIssue();
        issue.customFields = Map<string, CustomField>({1: {key: 'C1-2', value: 'One Two'}});
        expect(filtersFromQs({'cf.1': 'C1-1'}).filterVisible(issue)).toBe(false);
      });
      it ('Non match, no custom field in issue', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'cf.1': 'C1-1'}).filterVisible(issue)).toBe(false);
      });
      it ('Non match (none)', () => {
        const issue: BoardIssueView = emptyIssue();
        issue.customFields = Map<string, CustomField>({1: {key: 'C1-1', value: 'One One'}});
        expect(filtersFromQs({'cf.1': NONE_FILTER_KEY}).filterVisible(issue)).toBe(false);
      });
    });
    describe('Parallel Tasks', () => {
      it('None', () => {
        // Since filters are chosen for the whole board, and parallel tasks are configured per project (with possible issue types)
        // we only want to filter ones which have this PT set up
        expect(filtersFromQs({'pt.CD': 'One'}).filterVisible(emptyIssue())).toBe(false);
      });
      describe('No overrides', () => {
        let projectState: ProjectState;
        const issue: BoardIssueView = emptyIssue();
        beforeEach(() => {
          const projectTasks: List<List<ParallelTask>> = List<List<ParallelTask>>([
            List<ParallelTask>([
              {name: 'Community Docs', display: 'CD', options: createPtOptions('One', 'Two', 'Three')},
              {name: 'Test Development', display: 'TD', options: createPtOptions('Uno', 'Dos', 'Tres')}
            ])
          ]);
          projectState = {
            boardProjects: OrderedMap<string, BoardProject>({
              ISSUE: {
                key: 'ISSUE',
                parallelTasks: projectTasks,
              }
            }),
            linkedProjects: null
          };
          issue.parallelTasks = projectTasks;
          issue.selectedParallelTasks = createSelecteParallelTasks([[0, 1]]);
        });
        it ('Matches one', () => {
          expect(filtersWithProjectStateFromQs(projectState, {'pt.CD': 'One'}).filterVisible(issue)).toBe(true);
        });
        it ('Matches other', () => {
          expect(filtersWithProjectStateFromQs(projectState, {'pt.TD': 'Dos'}).filterVisible(issue)).toBe(true);
        });
        it ('Matches both', () => {
          expect(filtersWithProjectStateFromQs(projectState, {'pt.CD': 'One', 'pt.TD': 'Dos'}).filterVisible(issue)).toBe(true);
        });
        it ('Matches one of several', () => {
          expect(filtersWithProjectStateFromQs(projectState, {'pt.CD': 'One,Two,Three'}).filterVisible(issue)).toBe(true);
        });
        it ('Matches other of several', () => {
          expect(filtersWithProjectStateFromQs(projectState, {'pt.TD': 'Uno,Dos,Tres'}).filterVisible(issue)).toBe(true);
        });
        it ('Matches both of several', () => {
          expect(
            filtersWithProjectStateFromQs(
              projectState, {'pt.CD': 'One, Two, Three', 'pt.TD': 'Uno,Dos,Tres'}).filterVisible(issue)).toBe(true);
        });
        it ('Skip matching for unknown', () => {
          // Since filters are chosen for the whole board, and parallel tasks are configured per project (with possible issue types)
          // we only want to filter ones which have this PT set up
          expect(filtersWithProjectStateFromQs(projectState, {'pt.UNKNOWN': 'One'}).filterVisible(issue)).toBe(false);
        });
        it ('Non Match - one', () => {
          expect(filtersWithProjectStateFromQs(projectState, {'pt.CD': 'Two'}).filterVisible(issue)).toBe(false);
        });
        it ('Non Match - other', () => {
          expect(filtersWithProjectStateFromQs(projectState, {'pt.TD': 'Tres'}).filterVisible(issue)).toBe(false);
        });
      });
      describe('Overrides', () => {
        let projectState: ProjectState;
        const issue: BoardIssueView = emptyIssue();
        beforeEach(() => {
          const projectTasks: List<List<ParallelTask>> = List<List<ParallelTask>>([
            List<ParallelTask>([
              {name: 'Community Docs', display: 'CD', options: createPtOptions('One', 'Two', 'Three')},
              {name: 'Test Development', display: 'TD', options: createPtOptions('Uno', 'Dos', 'Tres')}
            ])
          ]);
          projectState = {
            boardProjects: OrderedMap<string, BoardProject>({
              ISSUE: {
                key: 'ISSUE',
                parallelTasks: projectTasks,
                parallelTaskIssueTypeOverrides: Map<string, List<List<ParallelTask>>>({
                  'task': List<List<ParallelTask>>([
                    List<ParallelTask>([
                      {name: 'Test Development', display: 'TD', options: createPtOptions('Ein', 'Zwei', 'Drei')},
                      {name: 'Community Docs', display: 'CD', options: createPtOptions('En', 'To', 'Tre')}
                    ])
                  ])
                })
              }
            }),
            linkedProjects: null
          };
        });
        describe('Main PTs', () => {
          beforeEach(() => {
            issue.parallelTasks = projectState.boardProjects.get('ISSUE').parallelTasks;
            issue.selectedParallelTasks = createSelecteParallelTasks([[0, 1]]);
          });
          it ('Matches one', () => {
            expect(filtersWithProjectStateFromQs(projectState, {'pt.CD': 'One'}).filterVisible(issue)).toBe(true);
          });
          it ('Matches other', () => {
            expect(filtersWithProjectStateFromQs(projectState, {'pt.TD': 'Dos'}).filterVisible(issue)).toBe(true);
          });
          it ('Non-Match one', () => {
            expect(filtersWithProjectStateFromQs(projectState, {'pt.CD': 'To'}).filterVisible(issue)).toBe(false);
          });
          it ('Non-Match other', () => {
            expect(filtersWithProjectStateFromQs(projectState, {'pt.TD': 'Drei'}).filterVisible(issue)).toBe(false);
          });
        });
        describe('Other PTs', () => {
          beforeEach(() => {
            issue.type = {name: 'task', colour: 'red'};
            issue.parallelTasks = projectState.boardProjects.get('ISSUE').parallelTaskIssueTypeOverrides.get('task');
            issue.selectedParallelTasks = createSelecteParallelTasks([[1, 0]]);
          });
          it ('Matches one', () => {
            expect(filtersWithProjectStateFromQs(projectState, {'pt.CD': 'En'}).filterVisible(issue)).toBe(true);
          });
          it ('Matches other', () => {
            expect(filtersWithProjectStateFromQs(projectState, {'pt.TD': 'Zwei'}).filterVisible(issue)).toBe(true);
          });
          it ('Non-Match one', () => {
            expect(filtersWithProjectStateFromQs(projectState, {'pt.CD': 'One'}).filterVisible(issue)).toBe(false);
          });
          it ('Non-Match other', () => {
            expect(filtersWithProjectStateFromQs(projectState, {'pt.TD': 'Dos'}).filterVisible(issue)).toBe(false);
          });
        });
      });
      describe('Empty Overrides', () => {
        let projectState: ProjectState;
        const issue: BoardIssueView = emptyIssue();
        beforeEach(() => {
          const projectTasks: List<List<ParallelTask>> = List<List<ParallelTask>>([
            List<ParallelTask>([
              {name: 'Community Docs', display: 'CD', options: createPtOptions('One', 'Two', 'Three')},
              {name: 'Test Development', display: 'TD', options: createPtOptions('Uno', 'Dos', 'Tres')}
            ])
          ]);
          projectState = {
            boardProjects: OrderedMap<string, BoardProject>({
              ISSUE: {
                key: 'ISSUE',
                parallelTasks: projectTasks,
                parallelTaskIssueTypeOverrides: Map<string, List<List<ParallelTask>>>({
                  'task': EMPTY_PARALLEL_TASK_OVERRIDE
                })
              }
            }),
            linkedProjects: null
          };
        });
        describe('Main PTs', () => {
          beforeEach(() => {
            issue.parallelTasks = projectState.boardProjects.get('ISSUE').parallelTasks;
            issue.selectedParallelTasks = createSelecteParallelTasks([[0, 1]]);
          });
          it ('Matches one', () => {
            expect(filtersWithProjectStateFromQs(projectState, {'pt.CD': 'One'}).filterVisible(issue)).toBe(true);
          });
          it ('Matches other', () => {
            expect(filtersWithProjectStateFromQs(projectState, {'pt.TD': 'Dos'}).filterVisible(issue)).toBe(true);
          });
        });
        describe('Other PTs', () => {
          beforeEach(() => {
            issue.type = {name: 'task', colour: 'red'};
            issue.parallelTasks = projectState.boardProjects.get('ISSUE').parallelTaskIssueTypeOverrides.get('task');
            issue.selectedParallelTasks = createSelecteParallelTasks([[1, 0]]);
          });
          it ('Non-Match one overridden', () => {
            expect(filtersWithProjectStateFromQs(projectState, {'pt.CD': 'En'}).filterVisible(issue)).toBe(false);
          });
          it ('Non-Match other', () => {
            expect(filtersWithProjectStateFromQs(projectState, {'pt.TD': 'Zwei'}).filterVisible(issue)).toBe(false);
          });
        });
      });
    });
  });

  describe('Search filters', () => {
    it ('No filters', () => {
      const issue: BoardIssueView = emptyIssue();
      expect(filtersFromQs({}).filterMatchesSearch(issue)).toBe(true);
    });

    describe('Issue keys', () => {
      it ('Matches', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'s.ids': 'ISSUE-1'}).filterMatchesSearch(issue)).toBe(true);
      });
      it ('Matches one out of several', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'s.ids': 'ISSUE-10,ISSUE-1'}).filterMatchesSearch(issue)).toBe(true);
      });
      it ('Non match', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'s.ids': 'ISSUE-10'}).filterMatchesSearch(issue)).toBe(false);
      });
    });

    describe('Containing text', () => {
      it ('Matches', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'s.text': 'hello%20this'}).filterMatchesSearch(issue)).toBe(true);
      });

      it ('Non-match', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'s.text': 'hello%20that'}).filterMatchesSearch(issue)).toBe(false);
      });
    });

    describe('Both', () => {
      it ('Matches both', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'s.ids': 'ISSUE-1', 's.text': 'hello%20this'}).filterMatchesSearch(issue)).toBe(true);
      });
      it ('Matches id only', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'s.ids': 'ISSUE-1', 's.text': 'hello%20that'}).filterMatchesSearch(issue)).toBe(false);
      });
      it ('Matches text only', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'s.ids': 'ISSUE-10', 's.text': 'hello%20this'}).filterMatchesSearch(issue)).toBe(false);
      });
      it ('Matches none', () => {
        const issue: BoardIssueView = emptyIssue();
        expect(filtersFromQs({'s.ids': 'ISSUE-10', 's.text': 'hello%20that'}).filterMatchesSearch(issue)).toBe(false);
      });
    });
  });


  function filtersFromQs(qs: Dictionary<string>, currentUser?: string): AllFilters {
    const projectState = {
        boardProjects: null,
        linkedProjects: null,
        parallelTasks: Map<string, List<List<ParallelTask>>>()
      };
    return filtersWithProjectStateFromQs(projectState, qs, currentUser);
  }

  function filtersWithProjectStateFromQs(projectState: ProjectState, qs: Dictionary<string>, currentUser?: string): AllFilters {
    const action: Action = UserSettingActions.createInitialiseFromQueryString(qs);
    const boardFilters: BoardFilterState =
      boardFilterMetaReducer(initialBoardFilterState, action);
    const searchFilters: BoardSearchFilterState =
      boardSearchFilterMetaReducer(initialBoardSearchFilterState, action);
    return new AllFilters(boardFilters, searchFilters, projectState, currentUser);
  }

  function emptyIssue(): BoardIssueView {
    return {
      key: 'ISSUE-1',
      projectCode: 'ISSUE',
      priority: {name: 'high', colour: null},
      type: {name: 'bug', colour: null},
      summary: 'Hello this is an issue',
      assignee: NO_ASSIGNEE,
      components: OrderedSet<string>(['C1', 'C2']),
      labels: OrderedSet<string>(['L1', 'L2']),
      fixVersions: OrderedSet<string>(['F1', 'F2']),
      customFields: Map<string, CustomField>(),
      parallelTasks: null,
      selectedParallelTasks: null,
      linkedIssues: List<LinkedIssue>(),
      ownState: -1,
      projectColour: 'red',
      visible: true,
      matchesSearch: true,
      issueUrl: null,
      ownStateName: null,
      calculatedTotalHeight: 0,
      summaryLines: List<string>()
    };
  }

  function createPtOptions(...options: string[]): List<ParallelTaskOption> {
    const ptOptions: ParallelTaskOption[] = [];
    for (const option of options) {
      ptOptions.push({
        name: option,
        colour: 'red'
      });
    }
    return List<ParallelTaskOption>(ptOptions);
  }

  function createSelecteParallelTasks(selected: number[][]) {
    return List<List<number>>().withMutations(mutable => {
      for (const group of selected) {
        mutable.push(List<number>(group));
      }
    });
  }
});


