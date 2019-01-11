import {IssueQlVisitor} from './ast/issue-ql.visitor';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {IssueQlExpressionOperator} from './ast/and-or-expression.iql';
import {IssueQlNode} from './ast/node.iql';
import {OrderedSet} from 'immutable';
import {NO_ASSIGNEE} from '../../../model/board/data/assignee/assignee.model';

export class IssueVisitor implements IssueQlVisitor<boolean> {
  constructor(private _issue: BoardIssue) {
  }

  visitAndOrExpression(operator: IssueQlExpressionOperator, operands: IssueQlNode[], not: boolean): boolean {
    let result: boolean;
    let effectiveOperator = operator;
    if (operator === IssueQlExpressionOperator.OR) {
      result = false;
      if (not) {
        result = true;
        effectiveOperator = IssueQlExpressionOperator.AND;
      }
    } else if (operator === IssueQlExpressionOperator.AND) {
      result = true;
      if (not) {
        result = false;
        effectiveOperator = IssueQlExpressionOperator.OR;
      }
    } else {
      // The grammar prevents this from happening
      throw new Error('Unknown operator: ' + operator);
    }

    for (const node of operands) {
      let nodeResult = node.accept(this);
      if (not) {
        nodeResult = !nodeResult;
      }
      if (effectiveOperator === IssueQlExpressionOperator.OR) {
        result = result || nodeResult;
        if (result) {
          return true;
        }
      } else if (effectiveOperator === IssueQlExpressionOperator.AND) {
        result = result && nodeResult;
        if (!result) {
          return false;
        }
      }
    }
    return result;
  }



  visitFactorExpression(id: string, operator: string, value: string): boolean {
    switch (id) {
      case 'ASSIGNEE':
        return this.matchSimpleStringValue(operator, this._issue.assignee.key, value);
      case 'COMPONENT':
      case 'COMPONENTS':
        return this.matchStringSetValue(operator, this._issue.components, value);
      case 'FIXVERSION':
        return this.matchStringSetValue(operator, this._issue.fixVersions, value);
      case 'LABEL':
      case 'LABELS':
        return this.matchStringSetValue(operator, this._issue.labels, value);
      case 'PRIORITY':
        return this.matchSimpleStringValue(operator, this._issue.priority.name, value);
      case 'PROJECT':
        return this.matchSimpleStringValue(operator, this._issue.projectCode, value);
      case 'TYPE':
        return this.matchSimpleStringValue(operator, this._issue.type.name, value);
      default:
        // The grammar prevents this from happening
        throw new Error('Unknown issue field id: ' + id);
    }
  }

  visitEmptyFactorExpression(id: string, not: boolean): boolean {
    let result: boolean;
    switch (id) {
      case 'ASSIGNEE':
        result = this._issue.assignee === NO_ASSIGNEE;
        break;
      case 'COMPONENT':
        result = this.nullToEmptyOrderedSet(this._issue.components).size === 0;
        break;
      case 'FIXVERSION':
        result = this.nullToEmptyOrderedSet(this._issue.fixVersions).size === 0;
        break;
      case 'LABELS':
        result = this.nullToEmptyOrderedSet(this._issue.labels).size === 0;
        break;
      case 'PRIORITY':
      case 'PROJECT':
      case 'TYPE':
        // These cannot be empty
        result = false;
        break;
      default:
        // The grammar prevents this from happening
        throw new Error('Unknown issue field id: ' + id);
    }

    if (not) {
      result = !result;
    }
    return result;
  }

  private matchStringSetValue(operator: string, issueValues: OrderedSet<string>, checkedValue: string): boolean {
    if (operator === '=') {
      return this.nullToEmptyOrderedSet(issueValues).contains(checkedValue);
    } else if (operator === '!=') {
      return !this.nullToEmptyOrderedSet(issueValues).contains(checkedValue);
    } else {
      // The grammar prevents this from happening
      throw new Error('Unknown operator: ' + operator);
    }
  }

  private matchSimpleStringValue(operator: string, issueValue: string, checkedValue: string): boolean {
    if (operator === '=') {
      return issueValue === checkedValue;
    } else if (operator === '!=') {
      return issueValue !== checkedValue;
    } else {
      // The grammar prevents this from happening
      throw new Error('Unknown operator: ' + operator);
    }
  }

  private nullToEmptyOrderedSet(set: OrderedSet<string>): OrderedSet<string> {
    if (!set) {
      return OrderedSet<string>();
    }
    return set;
  }

}
