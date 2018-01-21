import {BoardIssue} from '../../model/board/data/issue/board-issue';
import {List} from 'immutable';

/**
 * Board issue with extra state calculated in the view model
 */
export interface BoardIssueView extends BoardIssue {
  // TODO other fields as needed
  projectColour: string;
  visible: boolean;
  issueUrl: string;
  ownStateName: string;
  calculatedTotalHeight: number;
  summaryLines: List<string>;
}


