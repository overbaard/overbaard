import {initialAssigneeState} from './assignee/assignee.model';
import {initialIssueTypeState} from './issue-type/issue-type.model';
import {initialPriorityState} from './priority/priority.model';
import {initialComponentState} from './component/component.model';
import {initialLabelState} from './label/label.model';
import {initialFixVersionState} from './fix-version/fix-version.model';
import {initialCustomFieldState} from './custom-field/custom-field.model';
import {initialProjectState} from './project/project.model';
import {initialRankState} from './rank/rank.model';
import {initialIssueState} from './issue/issue.model';
import {initialBlacklistState} from './blacklist/blacklist.model';
import {initialHeaderState} from './header/header.model';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {BoardState} from './board';

const DEFAULT_STATE: BoardState = {
  viewId: -1,
  rankCustomFieldId: -1,
  jiraUrl: null,
  headers: initialHeaderState,
  assignees: initialAssigneeState,
  issueTypes: initialIssueTypeState,
  priorities: initialPriorityState,
  components: initialComponentState,
  labels: initialLabelState,
  fixVersions: initialFixVersionState,
  customFields: initialCustomFieldState,
  projects: initialProjectState,
  ranks: initialRankState,
  issues: initialIssueState,
  blacklist: initialBlacklistState
};

interface BoardStateRecord extends TypedRecord<BoardStateRecord>, BoardState {
}

const STATE_FACTORY = makeTypedFactory<BoardState, BoardStateRecord>(DEFAULT_STATE);
export const initialBoardState: BoardState = STATE_FACTORY(DEFAULT_STATE);

export class BoardUtil {
  static recordFromObject(o: BoardState): BoardState {
    return STATE_FACTORY(o);
  }

  static toStateRecord(s: BoardState): BoardStateRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <BoardStateRecord>s;
  }

  static withMutatons(s: BoardState, mutate: (mutable: BoardState) => any): BoardState {
    return (<BoardStateRecord>s).withMutations(mutable => {
      mutate(mutable);
    });
  }
}
