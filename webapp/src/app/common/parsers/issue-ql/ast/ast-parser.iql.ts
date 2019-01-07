/**
 * Takes the output of the parser and creates a proper object tree
 */
import {IssueQlNode} from './node.iql';
import {IssueQlFactorExpression} from './factor-expression.iql';
import {IssueQlAndOrExpression, IssueQlExpressionOperator} from './and-or-expression.iql';
import * as issueQlParser from '../pegjs/issue-ql.generated.js';
import {IssueQlEmptyFactorExpression} from './empty-factor-expression.iql';

export class IssueQlAstParser {
  constructor() {
  }

  createAstStructure(iqlString: string): IssueQlNode {
    return this.createAstNode(issueQlParser.parse(iqlString));
  }

  private createAstNode(input: any): IssueQlNode {
    const type: string = input['type'];
    if (type === 'factor-expression') {
      return this.createFactorExpression(input);
    } else if (type === 'empty-factor-expression') {
      return this.createEmptyFactorExpression(input);
    } else if (type === 'in-factor-expression') {
      return this.createInFactorExpression(input);
    } else if (type === 'expression' ) {
      return this.createExpression(input, IssueQlExpressionOperator.OR, 'terms');
    } else if (type === 'term') {
      return this.createExpression(input, IssueQlExpressionOperator.AND, 'factors');
    } else {
      throw new Error('Unknown type: ' + type);
    }
  }

  private createFactorExpression(input: any): IssueQlNode {
    const factorExpression: IssueQlFactorExpression
        = new IssueQlFactorExpression(
            (<string>input['id']).toLocaleUpperCase(),
            input['operator'],
            input['value']);
    return Object.freeze(factorExpression);
  }

  private createEmptyFactorExpression(input: any): IssueQlNode {
    const emptyFactorExpression: IssueQlEmptyFactorExpression
      = new IssueQlEmptyFactorExpression((<string>input['id']).toLocaleUpperCase(), input['not']);
    return Object.freeze(emptyFactorExpression);
  }

  private createExpression(input: any, operator: IssueQlExpressionOperator, operandsName: string): IssueQlNode {
    const operands: IssueQlNode[] = [];
    for (const nodeInput of input[operandsName]) {
      operands.push(this.createAstNode(nodeInput));
    }
    const not = !!input['not'];

    return Object.freeze(new IssueQlAndOrExpression(operator, <IssueQlNode[]>Object.freeze(operands), not));
  }

  private createInFactorExpression(input: any): IssueQlNode {
    const not = !!input['not'];
    const factorId = (<string>input['id']).toLocaleUpperCase();

    const values: IssueQlNode[] = [];
    for (const value of input['values']) {
      values.push(new IssueQlFactorExpression(
        factorId,
        '=',
        value));
    }

    return Object.freeze(new IssueQlAndOrExpression(IssueQlExpressionOperator.OR, <IssueQlNode[]>Object.freeze(values), not));
  }


}
