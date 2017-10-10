import {initialRankState, RankState} from './rank.model';
import {RankActions, rankReducer} from './rank.reducer';
import {getTestProjectsInput} from '../project/project.reducer.spec';
import {cloneObject} from '../../../common/object-util';

export function getTestRanksInput(): any {
  return getTestProjectsInput()['main'];
}
describe('Rank reducer tests', () => {

  describe('Deserialization tests', () => {
    it('Deserialize', () => {
      const rankState: RankState = rankReducer(
        initialRankState, RankActions.createDeserializeRanks(getTestRanksInput()));
      // Ranked keys
      expect(rankState.rankedIssueKeys.size).toBe(2);
      const p1Ranked = rankState.rankedIssueKeys.get('P1');
      expect(p1Ranked.toArray()).toEqual(['P1-1', 'P1-3', 'P1-2']);
      const p2Ranked = rankState.rankedIssueKeys.get('P2');
      expect(p2Ranked.toArray()).toEqual(['P2-3', 'P2-2', 'P2-1']);
    });

    it('Deserialize same', () => {
      const rankStateA: RankState = rankReducer(
        initialRankState, RankActions.createDeserializeRanks(getTestRanksInput()));
      const rankStateB: RankState = rankReducer(
        rankStateA, RankActions.createDeserializeRanks((getTestRanksInput())));
      expect(rankStateB).toBe(rankStateA);
    });
  });

  describe('Change tests', () => {
    let input: any;
    let state: RankState;
    beforeEach(() => {
      input = cloneObject({
        P: {ranked: ['P-1', 'P-2', 'P-3', 'P-4']}
      });
      state = rankReducer(
        initialRankState, RankActions.createDeserializeRanks(input));
      expect(state.rankedIssueKeys.size).toBe(1);
      expect(state.rankedIssueKeys.get('P').toArray()).toEqual(['P-1', 'P-2', 'P-3', 'P-4']);
    });

    it ('End issue to start', () => {
      const newState: RankState = rankReducer(
        state, RankActions.createRerank({P: [{index: 0, key: 'P-4'}]}, null));
      expect(newState.rankedIssueKeys.get('P').toArray()).toEqual(['P-4', 'P-1', 'P-2', 'P-3']);
    });

    it ('Third issue to start', () => {
      const newState: RankState = rankReducer(
        state, RankActions.createRerank({P: [{index: 0, key: 'P-3'}]}, null));
      expect(newState.rankedIssueKeys.get('P').toArray()).toEqual(['P-3', 'P-1', 'P-2', 'P-4']);
    });


    it ('Second issue to start', () => {
      const newState: RankState = rankReducer(
        state, RankActions.createRerank({P: [{index: 0, key: 'P-2'}]}, null));
      expect(newState.rankedIssueKeys.get('P').toArray()).toEqual(['P-2', 'P-1', 'P-3', 'P-4']);
    });


    it ('Start issue to end', () => {
      const newState: RankState = rankReducer(
        state, RankActions.createRerank({P: [{index: 3, key: 'P-1'}]}, null));
      expect(newState.rankedIssueKeys.get('P').toArray()).toEqual(['P-2', 'P-3', 'P-4', 'P-1']);
    });

    it ('Second issue to end', () => {
      const newState: RankState = rankReducer(
        state, RankActions.createRerank({P: [{index: 3, key: 'P-2'}]}, null));
      expect(newState.rankedIssueKeys.get('P').toArray()).toEqual(['P-1', 'P-3', 'P-4', 'P-2']);
    });

    it ('Third issue to end', () => {
      const newState: RankState = rankReducer(
        state, RankActions.createRerank({P: [{index: 3, key: 'P-3'}]}, null));
      expect(newState.rankedIssueKeys.get('P').toArray()).toEqual(['P-1', 'P-2', 'P-4', 'P-3']);
    });

    it ('Swap middle issues', () => {
      const newState: RankState = rankReducer(
        state, RankActions.createRerank({P: [{index: 2, key: 'P-2'}]}, null));
      expect(newState.rankedIssueKeys.get('P').toArray()).toEqual(['P-1', 'P-3', 'P-2', 'P-4']);
    });

    it ('Rank two issues', () => {
      const newState: RankState = rankReducer(
        state, RankActions.createRerank({P: [{index: 1, key: 'P-3'}, {index: 3, key: 'P-2'}]}, null));
      expect(newState.rankedIssueKeys.get('P').toArray()).toEqual(['P-1', 'P-3', 'P-4', 'P-2']);
    });

    it ('Rank all issues', () => {
      const newState: RankState = rankReducer(
        state, RankActions.createRerank({P:
          [{index: 0, key: 'P-3'}, {index: 1, key: 'P-4'}, {index: 2, key: 'P-1'}, {index: 3, key: 'P-2'}]}, null));
      expect(newState.rankedIssueKeys.get('P').toArray()).toEqual(['P-3', 'P-4', 'P-1', 'P-2']);
    });

    it ('Add issue to start', () => {
      const newState: RankState = rankReducer(
        state, RankActions.createRerank({P: [{index: 0, key: 'P-5'}]}, null));
      expect(newState.rankedIssueKeys.get('P').toArray()).toEqual(['P-5', 'P-1', 'P-2', 'P-3', 'P-4']);
    });

    it ('Add issue to middle', () => {
      const newState: RankState = rankReducer(
        state, RankActions.createRerank({P: [{index: 2, key: 'P-5'}]}, null));
      expect(newState.rankedIssueKeys.get('P').toArray()).toEqual(['P-1', 'P-2', 'P-5', 'P-3', 'P-4']);
    });


    it ('Add issue to end', () => {
      const newState: RankState = rankReducer(
        state, RankActions.createRerank({P: [{index: 4, key: 'P-5'}]}, null));
      expect(newState.rankedIssueKeys.get('P').toArray()).toEqual(['P-1', 'P-2', 'P-3', 'P-4', 'P-5']);
    });


    it ('Delete issue', () => {
      const newState: RankState = rankReducer(
        state, RankActions.createRerank({P: [{index: 0, key: 'P-3'}]}, ['P-1']));
      expect(newState.rankedIssueKeys.get('P').toArray()).toEqual(['P-3', 'P-2', 'P-4']);
    });
  });
});
