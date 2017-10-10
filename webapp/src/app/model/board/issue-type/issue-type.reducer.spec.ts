import {async} from '@angular/core/testing';
import {initialIssueTypeState, IssueType, IssueTypeState} from './issue-type.model';
import {IssueTypeActions, issueTypeReducer} from './issue-type.reducer';
import {cloneObject} from '../../../common/object-util';

export function getTestIssueTypesInput(): any {
  return cloneObject([
    {
      name: 'task',
      icon: '/types/task.png'
    },
    {
      name: 'bug',
      icon: '/types/bug.png'
    }
  ]);
}

export function getTestIssueTypeState(): IssueTypeState {
  const input = getTestIssueTypesInput();
  return issueTypeReducer(initialIssueTypeState, IssueTypeActions.createDeserializeIssueTypes(input));
}

describe('IssueType reducer tests', () => {
  let state: IssueTypeState;
  beforeEach(async(() => {
    state = getTestIssueTypeState();
  }));

  it('Deserialize initial state', () => {
    expect(state.types.size).toEqual(2);

    const keys: string[] = state.types.keySeq().toArray();
    expect(keys[0]).toEqual('task');
    expect(keys[1]).toEqual('bug');

    checkIssueType(state.types.get('task'), 'task', '/types/task.png');
    checkIssueType(state.types.get('bug'), 'bug', '/types/bug.png');
  });

  it ('Deserialize same state', () => {
    const stateA: IssueTypeState =
      issueTypeReducer(initialIssueTypeState, IssueTypeActions.createDeserializeIssueTypes(getTestIssueTypesInput()));
    const stateB: IssueTypeState =
      issueTypeReducer(stateA, IssueTypeActions.createDeserializeIssueTypes(getTestIssueTypesInput()));
    expect(stateA).toBe(stateB);
  });

  function checkIssueType(issueType: IssueType, name: string, icon: string) {
    expect(issueType).toEqual(jasmine.anything());
    expect(issueType.name).toEqual(name);
    expect(issueType.icon).toEqual(icon);
  }
});
