import {IssueQlNode} from './node.iql';
import {IssueQlVisitor} from './issue-ql.visitor';

export class IssueQlFactorExpression implements IssueQlNode {
  constructor (
    private readonly _id: string,
    private readonly _operator: string,
    private readonly _value: string) {
  }

  accept<T>(vistor: IssueQlVisitor<T>): T {
    return vistor.visitFactorExpression(this._id, this._operator, this._value);
  }
}
