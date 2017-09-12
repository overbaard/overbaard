import {IssueActions, issueReducer} from './issue.reducer';
import {BoardIssue, DeserializeIssueLookupParams, initialIssueState, IssueState} from './issue.model';
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
import {ParallelTask} from '../project/project.model';
import {cloneObject} from '../../utils/test-util.spec';

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
      state: 5
    },
    'ISSUE-3': {
      key: 'ISSUE-3',
      type: 0,
      priority: 0,
      summary: 'Three',
      assignee: 0,
      state: 3
    },
    'ISSUE-4': {
      key: 'ISSUE-4',
      type: 0,
      priority: 1,
      summary: 'Four',
      state: 2
    }
  });
}
describe('Issue reducer tests', () => {

  let issueState: IssueState;
  let issues: Map<string, BoardIssue>;
  let lookupParams: DeserializeIssueLookupParams;
  beforeEach(async(() => {

    lookupParams = new DeserializeIssueLookupParams()
      .setAssignees(
        assigneeReducer(
          initialAssigneeState, AssigneeActions.createAddInitialAssignees(getTestAssigneesInput())).assignees.toList())
      .setPriorities(
        priorityReducer(
          initialPriorityState, PriorityActions.createDeserializePriorities(getTestPrioritiesInput())).priorities.toList())
      .setIssueTypes(
        issueTypeReducer(
          initialIssueTypeState, IssueTypeActions.createDeserializeIssueTypes(getTestIssueTypesInput())).types.toList())
      .setComponents(
        componentReducer(
          initialComponentState, ComponentActions.createDeserializeComponents(getTestComponentsInput())).components)
      .setLabels(
        labelReducer(
          initialLabelState, LabelActions.createDeserializeLabels(getTestLabelsInput())).labels)
      .setFixVersions(
        fixVersionReducer(
          initialFixVersionState, FixVersionActions.createDeserializeFixVersions(getTestFixVersionsInput())).versions);

    issueState = issueReducer(
      initialIssueState,
      IssueActions.createDeserializeIssuesAction(getTestIssuesInput(), lookupParams));
    issues = issueState.issues;
  }));


  it('Deserialize', () => {
    expect(issues.size).toEqual(4);
    const issueArray: BoardIssue[] = issues.toArray();
    new IssueChecker(issueArray[0],
      lookupParams.issueTypes.get(0), lookupParams.priorities.get(0), lookupParams.assignees.get(0), 'One', 0)
      .key('ISSUE-1')
      .addLinkedIssue('LNK-1', 'Linked 1')
      .check();
    new IssueChecker(issueArray[1],
      lookupParams.issueTypes.get(1), lookupParams.priorities.get(1), lookupParams.assignees.get(1), 'Two', 5)
      .key('ISSUE-2')
      .check();
    new IssueChecker(issueArray[2],
      lookupParams.issueTypes.get(0), lookupParams.priorities.get(0), lookupParams.assignees.get(0), 'Three', 3)
      .key('ISSUE-3')
      .check();
    new IssueChecker(issueArray[3],
      lookupParams.issueTypes.get(0), lookupParams.priorities.get(1), NO_ASSIGNEE, 'Four', 2)
      .key('ISSUE-4')
      .check();
  });

  it('Deserialize same state', () => {
    const state = issueReducer(
      issueState,
      IssueActions.createDeserializeIssuesAction(getTestIssuesInput(), lookupParams));
    expect(state).toBe(issueState);
  });

});
