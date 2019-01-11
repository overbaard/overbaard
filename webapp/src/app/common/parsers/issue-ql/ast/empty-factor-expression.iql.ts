import {IssueQlNode} from './node.iql';
import {IssueQlVisitor} from './issue-ql.visitor';

export class IssueQlEmptyFactorExpression implements IssueQlNode {
  constructor (
    private readonly _id: string,
    private readonly _not: boolean) {
  }

  accept<T>(vistor: IssueQlVisitor<T>): T {
    return vistor.visitEmptyFactorExpression(this._id, this._not);
  }
}
