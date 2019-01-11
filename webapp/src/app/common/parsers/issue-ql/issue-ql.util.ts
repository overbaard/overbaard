import {IssueQlNode} from './ast/node.iql';
import {IssueQlAstParser} from './ast/ast-parser.iql';
import * as issueQlParser from './pegjs/issue-ql.generated';

export class IssueQlUtil {
  static validateIssueQl(issueQl: string) {
    try {
      issueQlParser.parse(issueQl);
      return null;
    } catch (error) {
      // console.error('Error in parser');
      if (error instanceof issueQlParser.SyntaxError) {
        // console.error('Syntax error');
        // console.error(error);
      }
      return error;
    }
  }

  static createIssueQlNode(issueQl: string): IssueQlNode {
    return new IssueQlAstParser().createAstStructure(issueQl);
  }

}

