import {FixVersionActions, fixVersionReducer} from './fix-version.reducer';
import {FixVersionState, initialFixVersionState} from './fix-version.model';
import {List} from 'immutable';

export const FIX_VERSIONS_INPUT = ['F-1', 'F-2', 'F-3'];
describe('Fix Version reducer tests', () => {
  it('Deserialize initial state', () => {
    const state: FixVersionState =
      fixVersionReducer(initialFixVersionState, FixVersionActions.createDeserializeFixVersions(FIX_VERSIONS_INPUT));
    expect(state.versions).toEqual(List<string>(['F-1', 'F-2', 'F-3']));
  });

  it ('Deserialize same state', () => {
    const stateA: FixVersionState =
      fixVersionReducer(initialFixVersionState, FixVersionActions.createDeserializeFixVersions(FIX_VERSIONS_INPUT));
    const stateB: FixVersionState =
      fixVersionReducer(stateA, FixVersionActions.createDeserializeFixVersions(FIX_VERSIONS_INPUT));
    expect(stateA).toBe(stateB);
  });
});


