import {async} from '@angular/core/testing';
import {IssueType} from './issue-type.model';
import {initialIssueTypeState, IssueTypeActions, issueTypeReducer, IssueTypeState} from './issue-type.reducer';

export const ISSUE_TYPES_INPUT = [
  {
    name: 'task',
    icon: '/types/task.png'
  },
  {
    name: 'bug',
    icon: '/types/bug.png'
  }
];

describe('IssueType reducer tests', () => {
  let state: IssueTypeState;
  beforeEach(async(() => {
    const input = ISSUE_TYPES_INPUT;
    state = issueTypeReducer(initialIssueTypeState, IssueTypeActions.createDeserializeIssueTypes(input));
  }));

  it('Deserialize initial state', () => {
    expect(state.types.size).toEqual(2);

    const keys: string[] = state.types.keySeq().toArray();
    expect(keys[0]).toEqual('task');
    expect(keys[1]).toEqual('bug');

    checkIssueType(state.types.get('task'), 'task', '/types/task.png');
    checkIssueType(state.types.get('bug'), 'bug', '/types/bug.png');
  });

  function checkIssueType(issueType: IssueType, name: string, icon: string) {
    expect(issueType).toEqual(jasmine.anything());
    expect(issueType.name).toEqual(name);
    expect(issueType.icon).toEqual(icon);
  }
});
