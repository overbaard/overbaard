import {cloneObject} from '../utils/test-util.spec';
import {BoardActions, boardReducer, BoardState, initialBoardState} from './board.reducer';
import {getTestAssigneesInput} from './assignee/assignee.reducer.spec';
import {getTestComponentsInput} from './component/component.reducer.spec';
import {getTestPrioritiesInput} from './priority/priority.reducer.spec';
import {getTestIssueTypesInput} from './issue-type/issue-type.reducer.spec';
import {getTestLabelsInput} from './label/label.reducer.spec';
import {getTestCustomFieldsInput} from './custom-field/custom-field.reducer.spec';
import {getTestBlacklistInput} from './blacklist/blacklist.reducer.spec';
import {List, Map, OrderedMap} from 'immutable';
import {Assignee} from './assignee/assignee.model';
import {Priority} from './priority/priority.model';
import {IssueType} from './issue-type/issue-type.model';
import {CustomField} from './custom-field/custom-field.model';
import {BoardProject, ProjectState} from './project/project.model';
import {BoardIssue, Issue} from './issue/issue.model';
import {BlacklistState} from './blacklist/blacklist.model';
import {Header, HeaderState} from './header/header.model';

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
    it('Deserialize Full', () => {
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
      expect(components.toArray()).toEqual(['C-1', 'C-2', 'C-3']);

      const labels: List<string> = boardState.labels.labels;
      expect(labels.toArray()).toEqual(['L-1', 'L-2', 'L-3']);

      const priorities: OrderedMap<string, Priority> = boardState.priorities.priorities;
      expect(priorities.size).toBe(2);
      expect(priorities.get('Blocker').name).toEqual('Blocker');
      expect(priorities.get('Major').name).toEqual('Major');

      const issueTypes: OrderedMap<string, IssueType> = boardState.issueTypes.types;
      expect(issueTypes.size).toBe(2);
      expect(issueTypes.get('task').name).toEqual('task');
      expect(issueTypes.get('bug').name).toEqual('bug');

      const customFields: OrderedMap<string, List<CustomField>> = boardState.customFields.fields;
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

      const issues: Map<string, BoardIssue> = boardState.issues.issues;
      expect(issues.size).toBe(2);
      const issue1 = issues.get('P1-1');
      // This checking is a bit more in-depth than planned, but makes sure the lookups passed in to issue deserialization works
      // It might not be totally necessary, but doesn't hurt. If it becomes too cumbersome to maintain it, we can remove it
      expect(issue1.priority.name).toEqual('Major');
      expect(issue1.type.name).toEqual('bug');
      expect(issue1.priority.name).toEqual('Major');
      expect(issue1.components.size).toBe(1);
      expect(issue1.components.get(0)).toEqual('C-2');
      expect(issue1.labels.size).toBe(2);
      expect(issue1.labels.get(0)).toEqual('L-1');
      expect(issue1.customFields.size).toEqual(2);
      expect(issue1.customFields.get('Custom-2').value).toEqual('Second C2');
      expect(issue1.parallelTasks.size).toEqual(1);
      expect(issue1.parallelTasks.get(0)).toEqual('One');
      const issue2 = issues.get('P1-2');
      expect(issue2.key).toEqual('P1-2');

      const blacklist: BlacklistState = boardState.blacklist;
      expect(blacklist.states.size).toBe(2);
      expect(blacklist.priorities.size).toBe(2);
      expect(blacklist.issueTypes.size).toBe(2);
      expect(blacklist.issues.size).toBe(2);
    });

    it('Deserialize Minimum', () => {
      const input: any = getTestBoardsInput();
      delete input['components'];
      delete input['labels'];
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

      const priorities: OrderedMap<string, Priority> = boardState.priorities.priorities;
      expect(priorities.size).toBe(2);
      expect(priorities.get('Blocker').name).toEqual('Blocker');
      expect(priorities.get('Major').name).toEqual('Major');

      const issueTypes: OrderedMap<string, IssueType> = boardState.issueTypes.types;
      expect(issueTypes.size).toBe(2);
      expect(issueTypes.get('task').name).toEqual('task');
      expect(issueTypes.get('bug').name).toEqual('bug');

      const customFields: OrderedMap<string, List<CustomField>> = boardState.customFields.fields;
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

});
