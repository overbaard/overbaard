import {initialRankState, RankState} from './rank.model';
import {RankActions, rankReducer} from './rank.reducer';
import {getTestProjectsInput} from '../project/project.reducer.spec';

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

});
