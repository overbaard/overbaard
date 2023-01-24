import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {BoardsService} from '../../services/boards.service';
import {AppHeaderService} from '../../services/app-header.service';
import {BehaviorSubject, config, Observable, Observer, Subject} from 'rxjs';
import {Iterator, OrderedMap} from 'immutable';
import {UntypedFormControl, UntypedFormGroup, Validators} from '@angular/forms';
import {map, take} from 'rxjs/operators';
import {IssueQlUtil} from '../../common/parsers/issue-ql/issue-ql.util';
import * as issueQlParser from '../../common/parsers/issue-ql/pegjs/issue-ql.generated';
import {UrlService} from '../../services/url.service';
import {environment} from '../../../environments/environment';
import {ProgressLogService} from '../../services/progress-log.service';

@Component({
  selector: 'app-configuration',
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
  providers: [BoardsService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigurationComponent implements OnInit {

  // There isn't much going on with data here, so we're not using redux in this area (for now). Instead we push
  // the current data to this subject
  config$: Subject<ConfigBoardsView> = new BehaviorSubject<ConfigBoardsView>(
    {
      boards: OrderedMap<number, any>(),
      canEditCustomFields: false,
      rankCustomFieldId: 0,
      epicLinkCustomFieldId: 0,
      epicNameCustomFieldId: 0});

  // For editing and deleting boards
  selected = -1;
  selectedBoardJson$: Observable<string>;
  editError: string;

  // For creating boards
  createForm: UntypedFormGroup;
  createError: string;

  // For saving the rank id
  customFieldsForm: UntypedFormGroup;

  fieldsRestApiUrl: string;

  constructor(private _boardsService: BoardsService,
              appHeaderService: AppHeaderService,
              private _urlService: UrlService,
              private _progressLog: ProgressLogService) {
    appHeaderService.setTitle('Configuration');
  }

  ngOnInit() {
    this.loadBoards();
    this.createForm = new UntypedFormGroup({
      createJson: new UntypedFormControl('', Validators.required)
    });
    this.fieldsRestApiUrl = this._urlService.caclulateRestUrl('rest/api/2/field');
  }

  private loadBoards() {
    // TODO log progress and errors
    this._boardsService.loadBoardsList(false)
      .pipe(
        map(data => this.toConfigBoardView(data)),
        take(1),
      )
      .subscribe(
        value => {
          this.customFieldsForm = new UntypedFormGroup({
            rankCustomFieldId: new UntypedFormControl(value.rankCustomFieldId, Validators.pattern('[0-9]*')),
            epicLinkCustomFieldId: new UntypedFormControl(value.epicLinkCustomFieldId, Validators.pattern('[0-9]*')),
            epicNameCustomFieldId: new UntypedFormControl(value.epicNameCustomFieldId, Validators.pattern('[0-9]*'))
          });
          this.config$.next(value);
        });
  }

  onOpenBoardForEdit(id: number) {
    this.selected = id;
    // TODO progress and errors
    this.selectedBoardJson$ = this._boardsService.loadBoardConfigJson(id)
      .pipe(map(data => this.formatAsJson(data)));
  }

  onCloseBoardForEdit(id: number) {
    if (this.selected === id) {
      this.editError = null;
      this.selected = -1;
    }
  }

  private formatAsJson(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  onClearEditJsonError(event: Event) {
    this.editError = null;
  }

  clearSaveJsonErrors() {
    this.createError = null;
  }

  onDeleteBoard(event: Event) {
    const id = this.selected;

    console.log('Deleting board');

    if (!this.checkDemoAndLogMessage()) {
      return;
    }

    this._boardsService.deleteBoard(id)
      .pipe(
        map(data => this.toConfigBoardView(data)),
        take(1)
      )
      .subscribe(
        value => {
          this.config$.next(value);
          this.selected = -1;
        }
      );
  }


  onSaveCreatedBoard() {
    console.log('Saving created board');
    const json: string  = this.createForm.controls['createJson'].value;
    const jsonObject: Object = this.checkJson(json);
    if (!jsonObject) {
      this.createError = 'Contents must be valid json';
      return;
    }
    const issueQlError = this.checkManualSwimlanesIssueQl(jsonObject);
    if (issueQlError) {
      this.createError = issueQlError;
      return;
    }

    if (!this.checkDemoAndLogMessage()) {
      return;
    }

    this._boardsService.createBoard(json)
      .pipe(
        map<any, ConfigBoardsView>(data => {
          return this.toConfigBoardView(data);
        }),
        take(1)
      )
      .subscribe(
        value => {
          this.config$.next(value);
          this.createForm.controls['createJson'].setValue('');
          });

    this.config$
      .pipe(
        take(1)
      )
      .subscribe(data => {
      });
  }

  onSaveEditedBoard(boardJson: string) {
    console.log('Saving edited board');
    const jsonObject: Object = this.checkJson(boardJson);
    if (!jsonObject) {
      this.editError = 'Contents must be valid json';
      return;
    }
    const issueQlError = this.checkManualSwimlanesIssueQl(jsonObject);
    if (issueQlError) {
      this.editError = issueQlError;
      return;
    }

    if (!this.checkDemoAndLogMessage()) {
      return;
    }

    this._boardsService.saveBoard(this.selected, boardJson)
      .pipe(
        map<any, ConfigBoardsView>(data => this.toConfigBoardView(data)),
        take(1)
      )
      .subscribe(
        value => {
          this.config$.next(value);
        });
  }

  onSaveCustomFieldId() {
    if (!this.checkDemoAndLogMessage()) {
      return;
    }

    this._boardsService.saveCustomFieldsIds(
      this.customFieldsForm.value['rankCustomFieldId'],
      this.customFieldsForm.value['epicLinkCustomFieldId'],
      this.customFieldsForm.value['epicNameCustomFieldId'])
      .pipe(
        take(1)
      )
      .subscribe(
        data => {
          // We need to subscribe here since http actions are cold observables
        }
      );
  }


  private checkJson(value: string): Object {
    try {
      return JSON.parse(value);
    } catch (e) {
      return null;
    }
  }

  private toConfigBoardView(data: any): ConfigBoardsView {
    const boards: OrderedMap<number, any> =
      (<any[]>data['configs'])
        .reduce((om, boardCfg) => om.set(boardCfg['id'], boardCfg), OrderedMap<number, any>());

    return {
      boards: boards,
      canEditCustomFields: data['can-edit-custom-fields'],
      rankCustomFieldId: data['rank-custom-field-id'],
      epicLinkCustomFieldId: data['epic-link-custom-field-id'],
      epicNameCustomFieldId: data['epic-name-custom-field-id'],
    };
  }

  private checkManualSwimlanesIssueQl(boardConfig: Object): string {
    const cfg: any = boardConfig['config'];
    if (!cfg) {
      // Proper validation happens on server
      return;
    }
    const mslConfig = cfg['manual-swimlanes'];
    if (mslConfig) {
      if (!Array.isArray(mslConfig)) {
        // Proper validation happens on server
        return null;
      }
      for (const msl of mslConfig) {
        const entries: any = msl['entries'];
        if (!Array.isArray(entries)) {
          // Proper validation happens on server
          return null;
        }
        for (const entry of entries) {
          let iql = entry['issue-ql'];
          if (!iql) {
            // Proper validation happens on server
            return null;
          }
          iql = iql.trim();
          let error: issueQlParser.SyntaxError;
          if (iql.length > 0) {
            error = IssueQlUtil.validateIssueQl(iql);
            if (error) {
              return `"Invalid Issue QL: "${iql}". The parser error is: ${error}"`;
            }
          }
        }
      }
    }
  }

  private checkDemoAndLogMessage(): boolean {
    if (environment.demo) {
      this._progressLog.startUserAction().logWarning('This is a read-only demo instance. The selected functionality is not available');
      return false;
    }
    return true;
  }

}

interface ConfigBoardsView {
  boards: OrderedMap<number, any>;
  canEditCustomFields: boolean;
  rankCustomFieldId: number;
  epicLinkCustomFieldId: number;
  epicNameCustomFieldId: number;
}
