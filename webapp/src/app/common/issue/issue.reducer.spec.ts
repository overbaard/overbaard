import * as Immutable from 'immutable';
import {initialIssueState, IssueActions, issueReducer} from './issue.reducer';
import {BoardIssue} from './issue.model';
import {async} from '@angular/core/testing';
import {initialIssueTypeState, IssueTypeActions, issueTypeReducer} from '../issue-type/issue-type.reducer';
import {initialPriorityState, PriorityActions, priorityReducer} from '../priority/priority.reducer';
import {ASSIGNEES_INPUT} from '../assignee/assignee.reducer.spec';
import {ISSUE_TYPES_INPUT} from '../issue-type/issue-type.reducer.spec';
import {PRIORITIES_INPUT} from '../priority/priority.reducer.spec';
import {IssueChecker} from './issue.model.spec';
import {Assignee, NO_ASSIGNEE} from '../assignee/assignee.model';
import {IssueType} from '../issue-type/issue-type.model';
import {Priority} from '../priority/priority.model';
import {AssigneeActions, assigneeReducer, initialAssigneeState} from '../assignee/assignee.reducer';

describe('Issue reducer tests', () => {

  let types: Array<IssueType>;
  let priorities: Array<Priority>;
  let assignees: Array<Assignee>;
  let issues: Immutable.Map<string, BoardIssue>;
  beforeEach(async(() => {

    const input = [
      {
        key: 'ISSUE-1',
        type: 0,
        priority: 0,
        summary: 'One',
        assignee: 0,
        'linked-issues' : [
          {
            key : 'LNK-1',
            summary : 'Linked 1',
          }]
      },
      {
        key: 'ISSUE-2',
        type: 1,
        priority: 1,
        summary: 'Two',
        assignee: 1
      },
      {
        key: 'ISSUE-3',
        type: 0,
        priority: 0,
        summary: 'Three',
        assignee: 0
      },
      {
        key: 'ISSUE-4',
        type: 0,
        priority: 1,
        summary: 'Four'
      }
    ];

    assignees = assigneeReducer(
      initialAssigneeState,
      AssigneeActions.createAddInitialAssignees(ASSIGNEES_INPUT)).assignees.toArray();
    priorities = priorityReducer(
      initialPriorityState,
      PriorityActions.createDeserializePriorities(PRIORITIES_INPUT)).priorities.toArray();
    types = issueTypeReducer(
      initialIssueTypeState,
      IssueTypeActions.createDeserializeIssueTypes(ISSUE_TYPES_INPUT)).types.toArray();

    issues = issueReducer(
      initialIssueState,
      IssueActions.createDeserializeIssuesAction(input, assignees, types, priorities)).issues;
  }));


  it('Deserialize', () => {
    expect(issues.size).toEqual(4);
    const issueArray: BoardIssue[] = issues.toArray();
    new IssueChecker(issueArray[0], types[0], priorities[0], assignees[0], 'One')
      .key('ISSUE-1')
      .addLinkedIssue('LNK-1', 'Linked 1')
      .check();
    new IssueChecker(issueArray[1], types[1], priorities[1], assignees[1], 'Two')
      .key('ISSUE-2')
      .check();
    new IssueChecker(issueArray[2], types[0], priorities[0], assignees[0], 'Three')
      .key('ISSUE-3')
      .check();
    new IssueChecker(issueArray[3], types[0], priorities[1], NO_ASSIGNEE, 'Four')
      .key('ISSUE-4')
      .check();
  });
});
