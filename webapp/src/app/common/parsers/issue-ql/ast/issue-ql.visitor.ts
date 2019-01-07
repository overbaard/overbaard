import {IssueQlExpressionOperator} from './and-or-expression.iql';
import {IssueQlNode} from './node.iql';

export interface IssueQlVisitor<T> {
  visitAndOrExpression(operator: IssueQlExpressionOperator, operands: IssueQlNode[], not: boolean): T;
  visitFactorExpression(id: string, operator: string, value: string): T;
  visitEmptyFactorExpression(id: string, not: boolean): T;
}
