import {Pipe, PipeTransform} from '@angular/core';
import {List} from 'immutable';
import {BoardIssueView} from '../view-model/board/board-issue-view';

@Pipe({name: 'keyToIssueFilteredPipe'})
export class KeyToIssueFilteredPipe implements PipeTransform {

  transform(keys: List<string>, issues: Map<string, BoardIssueView>): List<BoardIssueView> {
    return List<BoardIssueView>().withMutations(mutable => {
        keys.forEach(curr => {
          const issue = issues.get(curr);
          if (issue.visible) {
            mutable.push(issue);
          }
        });
    });
  }
}
