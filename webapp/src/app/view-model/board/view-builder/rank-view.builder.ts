import {List, Map} from 'immutable';
import {RankViewEntry} from '../rank-view-entry';
import {BoardIssueView} from '../board-issue-view';
import {BoardViewModelUtil} from '../board-view.model';

export class RankViewBuilder {
  private readonly _current: List<RankViewEntry> = List<RankViewEntry>().asMutable();
  private readonly _currentMap: Map<string, RankViewEntry>;
  private _currentIndex = 0;
  private _changed = false;

  constructor(private readonly _existing: List<RankViewEntry>) {
    if (!_existing) {
      this._changed = true;
      this._currentMap = Map<string, RankViewEntry>();
    } else {
      this._currentMap =
        this._existing.reduce(
          (reduction, entry) => reduction.set(entry.issue.key, entry), Map<string, RankViewEntry>());
    }
  }

  push(boardIndex: number, issue: BoardIssueView): RankViewBuilder {
    let entry: RankViewEntry = null;
    if (!this._changed) {
      const existing: RankViewEntry = this._existing.get(this._currentIndex);
      if (existing && existing.issue === issue && existing.boardIndex === boardIndex) {
        entry = existing;
        this._currentIndex++;
      } else {
        this._changed = true;
      }
    }
    if (!entry) {
      entry = this._currentMap.get(issue.key);
      if (!entry || (entry.issue !== issue || entry.boardIndex !== boardIndex)) {
        entry = BoardViewModelUtil.createRankViewEntry(issue, boardIndex);
      }
    }
    if (entry.issue.visible) {
      this._current.push(entry);
    }
    return this;
  }

  getRankView(): List<RankViewEntry> {
    if (!this._changed) {
      if (this._current.size === this._existing.size) {
        return this._existing;
      }
    }
    return this._current.asImmutable();
  }
}
