import {IssueQlVisitor} from './ast/issue-ql.visitor';
import {IssueQlNode} from './ast/node.iql';

export class IssueQlMatcher {
  constructor(private _rootIqlNode: IssueQlNode) {
  }

  matchIssue<T>(issueVisitor: IssueQlVisitor<T>): T {
    return this._rootIqlNode.accept(issueVisitor);
  }
}

