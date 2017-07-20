import * as Immutable from 'immutable';
import {Assignee} from './assignee.model';

export interface AppStore {
  assignees: Assignee[];
}
