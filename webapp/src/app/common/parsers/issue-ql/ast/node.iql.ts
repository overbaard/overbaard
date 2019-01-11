import {IssueQlVisitor} from './issue-ql.visitor';

export interface IssueQlNode {
  accept<T>(vistor: IssueQlVisitor<T>): T;
}
