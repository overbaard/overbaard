import {Issue} from './issue';

export interface LinkedIssue extends Issue {
  state: number;
  stateName: string;
  colour: string;
  type?: string;
}
