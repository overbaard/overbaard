import {FixVersionActions, fixVersionReducer} from './fix-version.reducer';
import {FixVersionState, initialFixVersionState} from './fix-version.model';
import {List} from 'immutable';
import {cloneObject} from '../../utils/test-util.spec';

export function getTestFixVersionsInput(): any {
  return cloneObject(['F-1', 'F-2', 'F-3']);
}

describe('Fix Version reducer tests', () => {
  it('Deserialize initial state', () => {
    const state: FixVersionState =
      fixVersionReducer(initialFixVersionState, FixVersionActions.createDeserializeFixVersions(getTestFixVersionsInput()));
    expect(state.versions).toEqual(List<string>(['F-1', 'F-2', 'F-3']));
  });

  it ('Deserialize same state', () => {
    const stateA: FixVersionState =
      fixVersionReducer(initialFixVersionState, FixVersionActions.createDeserializeFixVersions(getTestFixVersionsInput()));
    const stateB: FixVersionState =
      fixVersionReducer(stateA, FixVersionActions.createDeserializeFixVersions(getTestFixVersionsInput()));
    expect(stateA).toBe(stateB);
  });
});


