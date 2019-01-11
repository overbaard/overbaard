import {IssueQlNode} from '../common/parsers/issue-ql/ast/node.iql';

export interface UpdateIssueQlEvent {
  iqlString: string;
  iqlAst: IssueQlNode;
}
