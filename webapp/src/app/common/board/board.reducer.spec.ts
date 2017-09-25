import {cloneObject} from '../utils/test-util.spec';
import {BoardActions, boardReducer, BoardState, initialBoardState} from './board.reducer';
import {getTestComponentsInput} from './component/component.reducer.spec';
import {getTestPrioritiesInput} from './priority/priority.reducer.spec';
import {getTestIssueTypesInput} from './issue-type/issue-type.reducer.spec';
import {getTestLabelsInput} from './label/label.reducer.spec';
import {getTestCustomFieldsInput} from './custom-field/custom-field.reducer.spec';
import {getTestBlacklistInput} from './blacklist/blacklist.reducer.spec';
import {List, Map, OrderedMap} from 'immutable';
import {Assignee, NO_ASSIGNEE} from './assignee/assignee.model';
import {Priority} from './priority/priority.model';
import {IssueType} from './issue-type/issue-type.model';
import {CustomField} from './custom-field/custom-field.model';
import {BoardProject, ProjectState} from './project/project.model';
import {BoardIssue} from './issue/issue.model';
import {BlacklistState} from './blacklist/blacklist.model';
import {Header} from './header/header.model';
import {RankState} from './rank/rank.model';
import {getTestAssigneesInput} from './assignee/assignee.reducer.spec';
import {getTestFixVersionsInput} from './fix-version/fix-version.reducer.spec';
import {IssueChecker} from './issue/issue.model.spec';

export function getTestBoardsInput(): any {
  return cloneObject(
    {
      view: 10,
      'rank-custom-field-id': 12345,
      states: [
        {name: 'S1'},
        {name: 'S2', header: 0},
        {name: 'S3', header: 1},
        {name: 'S4'},
        {name: 'S5'}
      ],
      headers: ['H1', 'H2'],
      backlog: 1,
      done: 1,
      assignees: getTestAssigneesInput(),
      components: getTestComponentsInput(),
      labels: getTestLabelsInput(),
      'fix-versions': getTestFixVersionsInput(),
      priorities: getTestPrioritiesInput(),
      'issue-types': getTestIssueTypesInput(),
      custom: getTestCustomFieldsInput(),
      projects: {
        owner: 'P1',
        main: {
          P1: {
            colour: '#FF0000',
            rank: true,
            'state-links': {
              S1: 'P1',
              S2: 'P2'
            },
            ranked: [
              'P1-1',
              'P1-2'
            ],
            'parallel-tasks' : [
              {
                name : 'PT A',
                display : 'A',
                options : [
                  'One',
                  'Two']
              }]
          }
        },
        linked: {
          L1: {
            states: [
              'L1-1',
              'L1-2'
            ]
          }
        }
      },
      issues: {
        'P1-1': {
          key: 'P1-1',
          state: 1,
          summary: 'Issue one',
          priority: 1,
          type: 1,
          components: [1],
          labels: [0, 1],
          custom: {'Custom-1': 0, 'Custom-2': 1},
          'parallel-tasks': [0]
        },
        'P1-2': {
          key: 'P1-2',
          state: 1,
          summary: 'Issue two',
          priority: 1,
          type: 1,
          'parallel-tasks': [1]
        }
      },
      blacklist: getTestBlacklistInput()
    }
  );
}
describe('Board reducer tests', () => {

  describe('Deserialization tests', () => {
    it('Full', () => {
      // Configures everything that can be
      const boardState: BoardState = boardReducer(
        initialBoardState, BoardActions.createDeserializeBoard(getTestBoardsInput()));
      expect(boardState.viewId).toBe(10);
      expect(boardState.rankCustomFieldId).toBe(12345);

      // Do some sanity checking of the contents. The individual reducer tests do in-depth checking

      const headers: List<List<Header>> = boardState.headers.headers;
      expect(headers.size).toEqual(2);
      expect(headers.get(0).size).toEqual(4);
      expect(headers.get(0).get(0).name).toEqual('Backlog');

      const assignees: OrderedMap<string, Assignee> = boardState.assignees.assignees;
      expect(assignees.size).toBe(2);
      expect(assignees.get('bob').initials).toEqual('BBB');
      expect(assignees.get('kabir').initials).toEqual('KK');

      const components: List<string> = boardState.components.components;
      expect(components.toArray()).toEqual(['C-10', 'C-20', 'C-30']);

      const labels: List<string> = boardState.labels.labels;
      expect(labels.toArray()).toEqual(['L-10', 'L-20', 'L-30']);

      const fixVersions: List<string> = boardState.fixVersions.versions;
      expect(fixVersions.toArray()).toEqual(['F-10', 'F-20', 'F-30']);

      const priorities: OrderedMap<string, Priority> = boardState.priorities.priorities;
      expect(priorities.size).toBe(2);
      expect(priorities.get('Blocker').name).toEqual('Blocker');
      expect(priorities.get('Major').name).toEqual('Major');

      const issueTypes: OrderedMap<string, IssueType> = boardState.issueTypes.types;
      expect(issueTypes.size).toBe(2);
      expect(issueTypes.get('task').name).toEqual('task');
      expect(issueTypes.get('bug').name).toEqual('bug');

      const customFields: OrderedMap<string, OrderedMap<string, CustomField>> = boardState.customFields.fields;
      expect(customFields.size).toBe(2);
      expect(customFields.get('Custom-1').size).toBe(3);
      expect(customFields.get('Custom-2').size).toBe(2);

      const projectState: ProjectState = boardState.projects;
      expect(projectState.owner).toEqual('P1');
      expect(projectState.boardProjects.size).toEqual(1);
      const project1: BoardProject = projectState.boardProjects.get('P1');
      expect(project1.boardStateNameToOwnStateName.size).toBe(2);
      expect(project1.canRank).toBe(true);
      expect(projectState.linkedProjects.size).toBe(1);
      expect(projectState.linkedProjects.get('L1').states.size).toBe(2);

      const rankState: RankState = boardState.ranks;
      expect(rankState.rankedIssueKeys.size).toBe(1);
      expect(rankState.rankedIssueKeys.get('P1').toArray()).toEqual(['P1-1', 'P1-2']);

      const issues: Map<string, BoardIssue> = boardState.issues.issues;
      expect(issues.size).toBe(2);
      const issue1 = issues.get('P1-1');
      // This checking is a bit more in-depth than planned, but makes sure the lookups passed in to issue deserialization works
      // It might not be totally necessary, but doesn't hurt. If it becomes too cumbersome to maintain it, we can trim it down
      new IssueChecker(
        issue1, issueTypes.get('bug'), priorities.get('Major'), NO_ASSIGNEE, 'Issue one', 1)
        .components('C-20')
        .labels('L-10', 'L-20')
        .customField('Custom-1', 'c1-A', 'First C1')
        .customField('Custom-2', 'c2-B', 'Second C2')
        .selectedParallelTaskOptions('One')
        .check();
      const issue2 = issues.get('P1-2');
      expect(issue2.key).toEqual('P1-2');

      const blacklist: BlacklistState = boardState.blacklist;
      expect(blacklist.states.size).toBe(2);
      expect(blacklist.priorities.size).toBe(2);
      expect(blacklist.issueTypes.size).toBe(2);
      expect(blacklist.issues.size).toBe(2);
    });

    it('Minimum', () => {
      const input: any = getTestBoardsInput();
      delete input['components'];
      delete input['labels'];
      delete input['fix-versions'];
      delete input['custom'];
      delete input['projects']['main']['P1']['parallel-tasks'];
      delete input['issues']['P1-1']['components'];
      delete input['issues']['P1-1']['labels'];
      delete input['issues']['P1-1']['custom'];
      delete input['issues']['P1-1']['parallel-tasks'];
      delete input['issues']['P1-2']['parallel-tasks'];
      delete input['blacklist'];
      // Configures everything that can be
      const boardState: BoardState = boardReducer(
        initialBoardState, BoardActions.createDeserializeBoard(input));
      expect(boardState.viewId).toBe(10);
      expect(boardState.rankCustomFieldId).toBe(12345);

      // Do some sanity checking of the contents. The individual reducer tests do in-depth checking

      // We've checked these properly in the 'Deserialize Full' test above
      const headers: List<List<Header>> = boardState.headers.headers;
      expect(headers.size).toEqual(2);

      const assignees: OrderedMap<string, Assignee> = boardState.assignees.assignees;
      expect(assignees.size).toBe(2);
      expect(assignees.get('bob').initials).toEqual('BBB');
      expect(assignees.get('kabir').initials).toEqual('KK');

      const components: List<string> = boardState.components.components;
      expect(components.toArray()).toEqual([]);

      const labels: List<string> = boardState.labels.labels;
      expect(labels.toArray()).toEqual([]);

      const fixVersions: List<string> = boardState.fixVersions.versions;
      expect(fixVersions.toArray()).toEqual([]);

      const priorities: OrderedMap<string, Priority> = boardState.priorities.priorities;
      expect(priorities.size).toBe(2);
      expect(priorities.get('Blocker').name).toEqual('Blocker');
      expect(priorities.get('Major').name).toEqual('Major');

      const issueTypes: OrderedMap<string, IssueType> = boardState.issueTypes.types;
      expect(issueTypes.size).toBe(2);
      expect(issueTypes.get('task').name).toEqual('task');
      expect(issueTypes.get('bug').name).toEqual('bug');

      const customFields: OrderedMap<string, OrderedMap<string, CustomField>> = boardState.customFields.fields;
      expect(customFields.size).toBe(0);

      const projectState: ProjectState = boardState.projects;
      expect(projectState.owner).toEqual('P1');
      expect(projectState.boardProjects.size).toEqual(1);
      const project1: BoardProject = projectState.boardProjects.get('P1');
      expect(project1.boardStateNameToOwnStateName.size).toBe(2);
      expect(project1.canRank).toBe(true);
      expect(projectState.linkedProjects.size).toBe(1);
      expect(projectState.linkedProjects.get('L1').states.size).toBe(2);

      const issues: Map<string, BoardIssue> = boardState.issues.issues;
      expect(issues.size).toBe(2);
      const issue1 = issues.get('P1-1');
      // Don't check the nullable fields like custom fields, components, labels, fix version and
      expect(issue1.key).toEqual('P1-1');
      const issue2 = issues.get('P1-2');
      expect(issue2.key).toEqual('P1-2');

      const blacklist: BlacklistState = boardState.blacklist;
      expect(blacklist.states.size).toBe(0);
      expect(blacklist.priorities.size).toBe(0);
      expect(blacklist.issueTypes.size).toBe(0);
      expect(blacklist.issues.size).toBe(0);
    });

    it('Deserialize same', () => {
      const boardStateA: BoardState = boardReducer(
        initialBoardState, BoardActions.createDeserializeBoard(getTestBoardsInput()));
      const boardStateB: BoardState = boardReducer(
        boardStateA, BoardActions.createDeserializeBoard(getTestBoardsInput()));
      expect(boardStateB).toBe(boardStateA);
    });
  });

  describe('Changes', () => {
    let boardState: BoardState;
    beforeEach(() => {
      boardState = boardReducer(
        initialBoardState, BoardActions.createDeserializeBoard(getTestBoardsInput()));
    });

    it ('Empty', () => {
      // This is highly unlikely but we might as well test it
      const changes: any = {
        changes: {
          view: 11
        }
      };
      const newState: BoardState = boardReducer(boardState, BoardActions.createChanges(changes));
      expect(newState.viewId).toBe(11);
      checkSameStateEntries(boardState, newState);
    });

    it ('Extensive', () => {
      const changes: any = {
        changes: {
          view: 11,
          assignees : [{
            key : 'jason',
            email : 'jason@example.com',
            avatar : '/avatars/jason.png',
            name : 'Jason Greene'
          }],
          components: ['C-15'],
          labels: ['L-25'],
          'fix-versions': ['F-05'],
          blacklist: {states: ['NewBadState']},
          custom: {
            'Custom-1': [{key: 'a', value: 'A'}, {key: 'b', value: 'B'}, {key: 'c', value: 'C'}]
          },
          rank: {P1: [{index: 1, key: 'P1-4'}, {index: 2, key: 'P1-3'}]},
          issues: {
            new: [
              {
                key: 'P1-3',
                state: 'P1',
                summary: 'Three',
                priority: 'Blocker',
                type: 'task',
                assignee: 'jason',
                components: ['C-15'],
                labels: ['L-25'],
                custom: {
                  'Custom-1': 'c'
                }
              },
              {
                key: 'P1-4',
                state: 'P2',
                summary: 'Four',
                priority: 'Major',
                type: 'bug'
              }
            ],
            update: [{key: 'P1-1', summary: 'Changed'}],
            delete: ['P1-2']
          }
        }
      };
      const newState: BoardState = boardReducer(boardState, BoardActions.createChanges(changes));
      expect(newState.viewId).toBe(11);
      // These will never change via changes
      checkSameStateEntries(boardState, newState, 'rankCustomField', 'headers', 'priorities', 'issueTypes', 'projects');

      // Do some sanity checking of the contents. The individual reducer tests do in-depth checking

      const assignees: OrderedMap<string, Assignee> = newState.assignees.assignees;
      expect(assignees.size).toBe(3);
      expect(assignees.get('bob').initials).toEqual('BBB');
      expect(assignees.get('jason').initials).toEqual('JG');
      expect(assignees.get('kabir').initials).toEqual('KK');

      const components: List<string> = newState.components.components;
      expect(components.toArray()).toEqual(['C-10', 'C-15', 'C-20', 'C-30']);

      const labels: List<string> = newState.labels.labels;
      expect(labels.toArray()).toEqual(['L-10', 'L-20', 'L-25', 'L-30']);

      const fixVersions: List<string> = newState.fixVersions.versions;
      expect(fixVersions.toArray()).toEqual(['F-05', 'F-10', 'F-20', 'F-30']);

      const customFields: OrderedMap<string, OrderedMap<string, CustomField>> = newState.customFields.fields;
      expect(customFields.size).toBe(2);
      expect(customFields.get('Custom-1').size).toBe(6);
      expect(customFields.get('Custom-2').size).toBe(2);

      const rankState: RankState = newState.ranks;
      expect(rankState.rankedIssueKeys.size).toBe(1);
      expect(rankState.rankedIssueKeys.get('P1').toArray()).toEqual(['P1-1', 'P1-4', 'P1-3']);

      const issues: Map<string, BoardIssue> = newState.issues.issues;
      expect(issues.size).toBe(3);
      const issue1 = issues.get('P1-1');
      expect(issue1.summary).toEqual('Changed');
      // This checking is a bit more in-depth than planned, but makes sure the lookups passed in to issue deserialization works
      // It might not be totally necessary, but doesn't hurt. If it becomes too cumbersome to maintain it, we can trim it down
      new IssueChecker(
        issues.get('P1-3'), newState.issueTypes.types.get('task'), newState.priorities.priorities.get('Blocker'),
        assignees.get('jason'), 'Three', 0)
        .components('C-15')
        .labels('L-25')
        .customField('Custom-1', 'c', 'C')
        .check();
      new IssueChecker(
        issues.get('P1-4'), newState.issueTypes.types.get('bug'), newState.priorities.priorities.get('Major'),
        NO_ASSIGNEE, 'Four', 1)
        .check();

      const blacklist: BlacklistState = newState.blacklist;
      expect(blacklist.states.size).toBe(3);
      expect(blacklist.priorities.size).toBe(2);
      expect(blacklist.issueTypes.size).toBe(2);
      expect(blacklist.issues.size).toBe(2);
    });

    it ('Issues added to the blacklist are removed from rank', () => {
      const changes: any = {
        changes: {
          view: 11,
          blacklist: {issues: ['P1-2']}
        }
      };
      const newState: BoardState = boardReducer(boardState, BoardActions.createChanges(changes));
      expect(newState.viewId).toBe(11);

      checkSameStateEntries(boardState, newState, 'headers', 'assignees', 'issueTypes', 'priorities', 'components',
        'labels', 'fixVersions', 'customFields', 'projects', 'issues');

      const rankState: RankState = newState.ranks;
      expect(rankState.rankedIssueKeys.size).toBe(1);
      expect(rankState.rankedIssueKeys.get('P1').toArray()).toEqual(['P1-1']);

      const blacklist: BlacklistState = newState.blacklist;
      expect(blacklist.states.size).toBe(2);
      expect(blacklist.priorities.size).toBe(2);
      expect(blacklist.issueTypes.size).toBe(2);
      expect(blacklist.issues.size).toBe(3);
      expect(blacklist.issues).toContain('P1-2');
    });

    it ('Issues removed from the blacklist are removed from rank', () => {
      // Issues removed from the blacklist should be removed from the issue table if they exist
      // This can happen if the change set includes adding the issue to the black list, and then the issue is deleted

      const changes: any = {
        changes: {
          view: 11,
          blacklist: {'removed-issues': ['P1-1', 'BAD-2']}
        }
      };
      const newState: BoardState = boardReducer(boardState, BoardActions.createChanges(changes));
      expect(newState.viewId).toBe(11);

      checkSameStateEntries(boardState, newState, 'headers', 'assignees', 'issueTypes', 'priorities', 'components',
        'labels', 'fixVersions', 'customFields', 'projects', 'issues');

      const rankState: RankState = newState.ranks;
      expect(rankState.rankedIssueKeys.size).toBe(1);
      expect(rankState.rankedIssueKeys.get('P1').toArray()).toEqual(['P1-2']);

      const blacklist: BlacklistState = newState.blacklist;
      expect(blacklist.states.size).toBe(2);
      expect(blacklist.priorities.size).toBe(2);
      expect(blacklist.issueTypes.size).toBe(2);
      expect(blacklist.issues.size).toBe(1);
      expect(blacklist.issues).toContain('BAD-1');
    });

    function checkSameStateEntries(originalState: BoardState, currentState: BoardState, ...included: string[]) {
      for (const key of Object.keys(originalState)) {
        if (key === 'viewId') {
          continue;
        }
        if (key === 'rankCustomFieldId') {
          expect(currentState[key]).toEqual(originalState[key]);
          continue;
        }

        if (included.length === 0 || included.indexOf(key) >= 0) {
          expect(currentState[key]).toBe(originalState[key]);
        } else {
          if (!currentState[key]) {
            expect(originalState).not.toEqual(jasmine.anything());
          } else {
            expect(currentState[key]).not.toBe(originalState[key]);
          }
        }
      }
    }
  });

});
