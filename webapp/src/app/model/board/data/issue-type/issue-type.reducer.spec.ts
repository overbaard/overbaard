import {async} from '@angular/core/testing';
import {initialIssueTypeState, IssueType, IssueTypeState} from './issue-type.model';
import {IssueTypeActions, issueTypeMetaReducer} from './issue-type.reducer';
import {cloneObject} from '../../../../common/object-util';

export function getTestIssueTypesInput(): any {
  return cloneObject([
    {
      name: 'task',
      colour: 'green'
    },
    {
      name: 'bug',
      colour: 'red'
    }
  ]);
}

export function getTestIssueTypeState(): IssueTypeState {
  const input = getTestIssueTypesInput();
  return issueTypeMetaReducer(initialIssueTypeState, IssueTypeActions.createDeserializeIssueTypes(input));
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

    checkIssueType(state.types.get('task'), 'task', 'green');
    checkIssueType(state.types.get('bug'), 'bug', 'red');
  });

  it ('Deserialize same state', () => {
    const stateA: IssueTypeState =
      issueTypeMetaReducer(initialIssueTypeState, IssueTypeActions.createDeserializeIssueTypes(getTestIssueTypesInput()));
    const stateB: IssueTypeState =
      issueTypeMetaReducer(stateA, IssueTypeActions.createDeserializeIssueTypes(getTestIssueTypesInput()));
    expect(stateA).toBe(stateB);
  });

  function checkIssueType(issueType: IssueType, name: string, colour: string) {
    expect(issueType).toEqual(jasmine.anything());
    expect(issueType.name).toEqual(name);
    expect(issueType.colour).toEqual(colour);
  }
});
