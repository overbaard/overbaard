import {Component, Inject, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, FormGroupDirective, NgForm, ValidationErrors} from '@angular/forms';
import {ErrorStateMatcher, MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {IssueQlUtil} from '../../../common/parsers/issue-ql/issue-ql.util';
import * as issueQlParser from '../../../common/parsers/issue-ql/pegjs/issue-ql.generated';

@Component({
  selector: 'app-issue-ql-dialog-component',
  templateUrl: './issue-ql-dialog.component.html',
  styleUrls: ['./issue-ql-dialog.component.scss']
})
export class IssueQlDialogComponent implements OnInit {

  issueQlInput: string;
  issueQlControl: FormControl;
  errorStateMatcher = new IssueQlErrorStateMatcher();

  constructor(
    public dialogRef: MatDialogRef<IssueQlDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {
    this.issueQlInput = data['issueQl'];
    console.log('"' + this.issueQlInput + '"');
  }

  ngOnInit(): void {
    this.issueQlControl = new FormControl(this.issueQlInput, (control: AbstractControl): ValidationErrors | null => {
      const value = control.value.trim();
      let error: issueQlParser.SyntaxError;
      if (value.length > 0) {
        error = IssueQlUtil.validateIssueQl(value);
      }
      return error ? {'issueQl': error} : null;
    });
  }

  onCancel(event: MouseEvent) {
    event.preventDefault();
    this.dialogRef.close();
  }

  onSave() {
    this.dialogRef.close({issueQl: this.issueQlControl.value.trim()});
  }
}

export class IssueQlErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

