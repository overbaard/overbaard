import {IssueActions, issueMetaReducer} from './issue.reducer';
import {DeserializeIssueLookupParams, initialIssueState, IssueState} from './issue.model';
import {async} from '@angular/core/testing';
import {getTestAssigneeState} from '../assignee/assignee.reducer.spec';
import {getTestIssueTypeState} from '../issue-type/issue-type.reducer.spec';
import {getTestPriorityState} from '../priority/priority.reducer.spec';
import {IssueChecker} from './issue.model.spec';
import {NO_ASSIGNEE} from '../assignee/assignee.model';
import {Map} from 'immutable';
import {getTestComponentState} from '../component/component.reducer.spec';
import {getTestLabelState} from '../label/label.reducer.spec';
import {getTestFixVersionState} from '../fix-version/fix-version.reducer.spec';
import {cloneObject} from '../../../../common/object-util';
import {BoardIssue} from './board-issue';

function getTestIssuesInput() {
  return cloneObject({
    'ISSUE-1': {
      key: 'ISSUE-1',
      type: 0,
      priority: 0,
      summary: 'One',
      assignee: 0,
      state: 0,
      'linked-issues' : [
        {
          key : 'LNK-1',
          summary : 'Linked 1',
        }]
    },
    'ISSUE-2': {
      key: 'ISSUE-2',
      type: 1,
      priority: 1,
      summary: 'Two',
      assignee: 1,
      state: 1
    },
    'ISSUE-3': {
      key: 'ISSUE-3',
      type: 0,
      priority: 0,
      summary: 'Three',
      assignee: 0,
      state: 0
    },
    'ISSUE-4': {
      key: 'ISSUE-4',
      type: 0,
      priority: 1,
      summary: 'Four',
      state: 1
    }
  });
}
describe('Issue reducer tests', () => {

  let issueState: IssueState;
  let issues: Map<string, BoardIssue>;
  let lookupParams: DeserializeIssueLookupParams;
  beforeEach(async(() => {

    lookupParams = new DeserializeIssueLookupParams()
      .setAssignees(getTestAssigneeState().assignees)
      .setPriorities(getTestPriorityState().priorities)
      .setIssueTypes(getTestIssueTypeState().types)
      .setComponents(getTestComponentState().components)
      .setLabels(getTestLabelState().labels)
      .setFixVersions(getTestFixVersionState().versions);

    issueState = issueMetaReducer(
      initialIssueState,
      IssueActions.createDeserializeIssuesAction(getTestIssuesInput(), lookupParams));
    issues = issueState.issues;
  }));

  describe('Deserialize', () => {
    it('Deserialize issues', () => {
      expect(issues.size).toEqual(4);
      const issueArray: BoardIssue[] = issues.toArray().sort((a, b) => a.key.localeCompare(b.key));
      new IssueChecker(issueArray[0],
        lookupParams.issueTypes.get('task'), lookupParams.priorities.get('Blocker'), lookupParams.assignees.get('bob'), 'One', 0)
        .key('ISSUE-1')
        .addLinkedIssue('LNK-1', 'Linked 1')
        .check();
      new IssueChecker(issueArray[1],
        lookupParams.issueTypes.get('bug'), lookupParams.priorities.get('Major'), lookupParams.assignees.get('kabir'), 'Two', 1)
        .key('ISSUE-2')
        .check();
      new IssueChecker(issueArray[2],
        lookupParams.issueTypes.get('task'), lookupParams.priorities.get('Blocker'), lookupParams.assignees.get('bob'), 'Three', 0)
        .key('ISSUE-3')
        .check();
      new IssueChecker(issueArray[3],
        lookupParams.issueTypes.get('task'), lookupParams.priorities.get('Major'), NO_ASSIGNEE, 'Four', 1)
        .key('ISSUE-4')
        .check();
    });

    it('Deserialize same state', () => {
      const state = issueMetaReducer(
        issueState,
        IssueActions.createDeserializeIssuesAction(getTestIssuesInput(), lookupParams));
      expect(state).toBe(issueState);
    });


    it('Deserialize some issues same, some changed', () => {
      const input: any = getTestIssuesInput();
      delete input['ISSUE-1'];
      input['ISSUE-2']['summary'] = 'Dos';

      input['ISSUE-5'] = input['ISSUE-4'];
      input['ISSUE-5']['key'] = 'ISSUE-5';
      input['ISSUE-5']['summary'] = 'Five';
      delete input['ISSUE-4'];

      const state = issueMetaReducer(
        issueState,
        IssueActions.createDeserializeIssuesAction(input, lookupParams));


      expect(state).not.toBe(issueState);
      expect(state.issues.size).toEqual(3);
      const issueArray: BoardIssue[] = state.issues.toArray().sort((a, b) => a.key.localeCompare(b.key));
      new IssueChecker(issueArray[0],
        lookupParams.issueTypes.get('bug'), lookupParams.priorities.get('Major'), lookupParams.assignees.get('kabir'), 'Dos', 1)
        .key('ISSUE-2')
        .check();
      new IssueChecker(issueArray[2],
        lookupParams.issueTypes.get('task'), lookupParams.priorities.get('Major'), NO_ASSIGNEE, 'Five', 1)
        .key('ISSUE-5')
        .check();

      expect(state.issues.get('ISSUE-3')).toBe(issues.get('ISSUE-3'));
    });
  });

  describe('Update', () => {
    it('Update and add issues', () => {
      // We don't need to check changes to everything here, as the issue model tests take care of that
      const changes: any = {
        update: [
          {
            key: 'ISSUE-2',
            type: 'task',
            priority: 'Blocker'
          },
          {
            key: 'ISSUE-3',
            summary: 'Trois'
          }
        ],
        new: [
          {
            key: 'ISSUE-5',
            summary: 'Five',
            type: 'bug',
            priority: 'Major'
            // Not that I am not setting the new state here to avoid wiring up more stuff for the test
            // Real data from the server will have this, and we're testing this more extensively in the issue model tests
          }
        ],
        delete: ['ISSUE-4']
      };
      const newState: IssueState = issueMetaReducer(
        issueState,
        IssueActions.createChangeIssuesAction(changes, lookupParams));

      expect(newState.issues.size).toEqual(4);
      const issueArray: BoardIssue[] = newState.issues.toArray().sort((a, b) => a.key.localeCompare(b.key));
      new IssueChecker(issueArray[0],
        lookupParams.issueTypes.get('task'), lookupParams.priorities.get('Blocker'), lookupParams.assignees.get('bob'), 'One', 0)
        .key('ISSUE-1')
        .addLinkedIssue('LNK-1', 'Linked 1')
        .check();
      new IssueChecker(issueArray[1],
        lookupParams.issueTypes.get('task'), lookupParams.priorities.get('Blocker'), lookupParams.assignees.get('kabir'), 'Two', 1)
        .key('ISSUE-2')
        .check();
      new IssueChecker(issueArray[2],
        lookupParams.issueTypes.get('task'), lookupParams.priorities.get('Blocker'), lookupParams.assignees.get('bob'), 'Trois', 0)
        .key('ISSUE-3')
        .check();
      new IssueChecker(issueArray[3],
        lookupParams.issueTypes.get('bug'), lookupParams.priorities.get('Major'), NO_ASSIGNEE, 'Five', -1)
        .key('ISSUE-5')
        .check();
    });

    it('no changes', () => {
      const changes: any = {};
      const newState: IssueState = issueMetaReducer(
        issueState,
        IssueActions.createChangeIssuesAction(changes, lookupParams));
      expect(newState).toBe(issueState);
    });

    it ('Updates only', () => {
      const changes: any = {
        update: [
          {
            key: 'ISSUE-2',
            type: 'task',
            priority: 'Blocker'
          }
        ]
      };
      const newState: IssueState = issueMetaReducer(
        issueState,
        IssueActions.createChangeIssuesAction(changes, lookupParams));

      expect(newState.issues.size).toEqual(4);
      const issueArray: BoardIssue[] = newState.issues.toArray().sort((a, b) => a.key.localeCompare(b.key));
      new IssueChecker(issueArray[0],
        lookupParams.issueTypes.get('task'), lookupParams.priorities.get('Blocker'), lookupParams.assignees.get('bob'), 'One', 0)
        .key('ISSUE-1')
        .addLinkedIssue('LNK-1', 'Linked 1')
        .check();
      new IssueChecker(issueArray[1],
        lookupParams.issueTypes.get('task'), lookupParams.priorities.get('Blocker'), lookupParams.assignees.get('kabir'), 'Two', 1)
        .key('ISSUE-2')
        .check();
      new IssueChecker(issueArray[2],
        lookupParams.issueTypes.get('task'), lookupParams.priorities.get('Blocker'), lookupParams.assignees.get('bob'), 'Three', 0)
        .key('ISSUE-3')
        .check();
      new IssueChecker(issueArray[3],
        lookupParams.issueTypes.get('task'), lookupParams.priorities.get('Major'), NO_ASSIGNEE, 'Four', 1)
        .key('ISSUE-4')
        .check();

    });

    it ('Deletions only', () => {
      // We don't need to check changes to everything here, as the issue model tests take care of that
      const changes: any = {
        delete: ['ISSUE-1', 'ISSUE-3', 'ISSUE-4']
      };
      const newState: IssueState = issueMetaReducer(
        issueState,
        IssueActions.createChangeIssuesAction(changes, lookupParams));

      expect(newState.issues.size).toEqual(1);
      const issueArray: BoardIssue[] = newState.issues.toArray().sort((a, b) => a.key.localeCompare(b.key));
      new IssueChecker(issueArray[0],
        lookupParams.issueTypes.get('bug'), lookupParams.priorities.get('Major'), lookupParams.assignees.get('kabir'), 'Two', 1)
        .key('ISSUE-2')
        .check();
    });
  });

});
