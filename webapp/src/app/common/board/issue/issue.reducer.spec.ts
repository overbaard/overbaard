import {IssueActions, issueReducer} from './issue.reducer';
import {BoardIssue, initialIssueState} from './issue.model';
import {async} from '@angular/core/testing';
import {IssueTypeActions, issueTypeReducer} from '../issue-type/issue-type.reducer';
import {PriorityActions, priorityReducer} from '../priority/priority.reducer';
import {getTestAssigneesInput} from '../assignee/assignee.reducer.spec';
import {getTestIssueTypesInput} from '../issue-type/issue-type.reducer.spec';
import {getTestPrioritiesInput} from '../priority/priority.reducer.spec';
import {IssueChecker} from './issue.model.spec';
import {Assignee, initialAssigneeState, NO_ASSIGNEE} from '../assignee/assignee.model';
import {initialIssueTypeState, IssueType} from '../issue-type/issue-type.model';
import {initialPriorityState, Priority} from '../priority/priority.model';
import {AssigneeActions, assigneeReducer} from '../assignee/assignee.reducer';
import {List, Map, OrderedMap} from 'immutable';
import {ComponentActions, componentReducer} from '../component/component.reducer';
import {initialComponentState} from '../component/component.model';
import {getTestComponentsInput} from '../component/component.reducer.spec';
import {LabelActions, labelReducer} from '../label/label.reducer';
import {initialLabelState} from '../label/label.model';
import {getTestLabelsInput} from '../label/label.reducer.spec';
import {FixVersionActions, fixVersionReducer} from '../fix-version/fix-version.reducer';
import {initialFixVersionState} from '../fix-version/fix-version.model';
import {getTestFixVersionsInput} from '../fix-version/fix-version.reducer.spec';
import {CustomField} from '../custom-field/custom-field.model';

describe('Issue reducer tests', () => {

  let types: Array<IssueType>;
  let priorities: Array<Priority>;
  let assignees: Array<Assignee>;
  let components: List<string>;
  let labels: List<string>;
  let fixVersions: List<string>;
  const customFields: OrderedMap<string, List<CustomField>> = OrderedMap<string, List<CustomField>>();
  let issues: Map<string, BoardIssue>;
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
      AssigneeActions.createAddInitialAssignees(getTestAssigneesInput())).assignees.toArray();
    priorities = priorityReducer(
      initialPriorityState,
      PriorityActions.createDeserializePriorities(getTestPrioritiesInput())).priorities.toArray();
    types = issueTypeReducer(
      initialIssueTypeState,
      IssueTypeActions.createDeserializeIssueTypes(getTestIssueTypesInput())).types.toArray();
    components = componentReducer(
      initialComponentState,
      ComponentActions.createDeserializeComponents(getTestComponentsInput())).components;
    labels = labelReducer(
      initialLabelState,
      LabelActions.createDeserializeLabels(getTestLabelsInput())).labels;
    fixVersions = fixVersionReducer(
      initialFixVersionState,
      FixVersionActions.createDeserializeFixVersions(getTestFixVersionsInput())).versions;

    issues = issueReducer(
      initialIssueState,
      IssueActions.createDeserializeIssuesAction(
        input, assignees, types, priorities, components, labels, fixVersions, customFields)).issues;
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
