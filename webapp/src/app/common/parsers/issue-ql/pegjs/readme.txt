The grammar lives in issue-ql.source.pegjs. When updating the grammar, you need to run

  yarn run issue-ql

This will create a new version of issue-ql.generated.ts.

Users should call these classes via ../ast/ast-parser.iql.ts rather than use this directly.
