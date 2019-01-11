import {IssueQlNode} from './node.iql';
import {IssueQlVisitor} from './issue-ql.visitor';

export class IssueQlAndOrExpression implements IssueQlNode {
  constructor (
    private readonly _operator: IssueQlExpressionOperator,
    private readonly _operands: IssueQlNode[],
    private readonly _not: boolean) {
  }

  accept<T>(visitor: IssueQlVisitor<T>): T {
    return visitor.visitAndOrExpression(this._operator, this._operands, this._not);
  }
}


export enum IssueQlExpressionOperator {
  OR,
  AND
}
