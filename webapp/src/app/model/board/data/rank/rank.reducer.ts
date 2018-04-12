import {Action} from '@ngrx/store';
import {List, Map, Set} from 'immutable';
import {initialRankState, RankState, RankUtil} from './rank.model';
import {IssueUtil} from '../issue/issue.model';

const DESERIALIZE_RANKS = 'DESERIALIZE_RANKS';
const RERANK = 'RERANK_ACTION';

class DeserializeRanksAction implements Action {
  readonly type = DESERIALIZE_RANKS;

  constructor(readonly payload: RankState) {
  }
}

class RerankAction implements Action {
  readonly type = RERANK;

  constructor(readonly payload: RerankPayload) {
  }
}

export class RankActions {
  static createDeserializeRanks(input: any): Action {
    const rankedIssueKeys: Map<string, List<string>> = Map<string, List<string>>().asMutable();
    for (const projectInput of input) {
      rankedIssueKeys.set(projectInput['code'], List<string>(projectInput['ranked']));
    }

    const payload: RankState = {
      rankedIssueKeys: rankedIssueKeys.asImmutable(),
    };

    return new DeserializeRanksAction(payload);
  }

  static createRerank(rankChanges: any, deleted: any): Action {
    if (rankChanges || deleted) {
      let changes: Map<string, RerankEntry[]> = Map<string, RerankEntry[]>();
      if (rankChanges) {
        changes = changes.withMutations(mutable => {
          for (const key of Object.keys(rankChanges)) {
            mutable.set(key, rankChanges[key]);
          }
        });
      }
      const deletions: Set<string> = deleted ? Set<string>(deleted) : Set<string>();
      return new RerankAction({deletions: deletions, changes: changes});
    }
    return new RerankAction(null);
  }
}

// 'meta-reducer here means it is not called directly by the store, rather from the boardReducer
export function rankMetaReducer(state: RankState = initialRankState, action: Action): RankState {
  switch (action.type) {
    case DESERIALIZE_RANKS: {
      const payload: RankState = (<DeserializeRanksAction>action).payload;
      return RankUtil.withMutations(state, mutable => {
        if (!mutable.rankedIssueKeys.equals(payload.rankedIssueKeys)) {
          mutable.rankedIssueKeys = payload.rankedIssueKeys;
        }
      });
    }
    case RERANK: {
      const payload: RerankPayload = (<RerankAction>action).payload;
      if (payload) {
        let rankedByProject: Map<string, List<string>> = state.rankedIssueKeys;
        if (payload.deletions) {
          rankedByProject = deleteIssues(rankedByProject, payload.deletions);
        }
        if (payload.changes) {
          rankedByProject = rankedByProject.withMutations(mutable => {
            payload.changes.forEach((changes, project) => {
              const reranked: List<string> = rankIssuesForProject(rankedByProject.get(project), changes);
              mutable.set(project, reranked);
            });
          });
        }

        const newState: RankState = RankUtil.withMutations(state, mutable => {
          mutable.rankedIssueKeys = rankedByProject;
        });
        return newState;
      }
      return state;
    }
  }
  return state;
}

function deleteIssues(rankedByProject: Map<string, List<string>>, deletions: Set<string>): Map<string, List<string>> {
  rankedByProject = rankedByProject.asImmutable();
  if (deletions) {
    deletions.forEach(key => {
      const projectCode: string = IssueUtil.productCodeFromKey(key);
      let issues: List<string> = rankedByProject.get(projectCode);
      if (issues) {
        const index = issues.indexOf(key);
        issues = issues.delete(index);
        rankedByProject = rankedByProject.set(projectCode, issues);
      }
    });
  }
  return rankedByProject.asImmutable();
}


function rankIssuesForProject(rankedIssueKeys: List<string>, changes: RerankEntry[]): List<string> {

  let changeIndex = 0;
  let change: RerankEntry = changes[changeIndex];

  // const keysRanked: Set<string> = Set<string>(rankedIssueKeys);
  const keysRanked: Set<string> = Set<string>(changes.map(entry => entry.key));

  const copy: string[] = [];
  for (let i = 0 ; i < rankedIssueKeys.size ; ) {
    const current: string = rankedIssueKeys.get(i);
    const insertIndex = copy.length;
    if (change && insertIndex === change.index) {
      copy.push(change.key);
      changeIndex++;
      change = changeIndex < changes.length ? changes[changeIndex] : null;
    } else {
      if (!keysRanked.contains(current)) {
        copy.push(current);
      }
      i++;
    }
  }

  while (change) {
    copy[change.index] = change.key;
    changeIndex++;
    change = changes[changeIndex];
  }
  return List<string>(copy);
}
interface RerankPayload {
  deletions: Set<string>;
  changes: Map<string, RerankEntry[]>;
}

interface RerankEntry {
  index: number;
  key: string;
}
