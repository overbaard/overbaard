import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {BoardsService} from '../../services/boards.service';
import {AppHeaderService} from '../../services/app-header.service';
import {Observable, Subject} from 'rxjs';
import {OrderedMap} from 'immutable';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {map, take} from 'rxjs/operators';

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
  config$: Subject<ConfigBoardsView> = new Subject();

  // For editing and deleting boards
  selected = -1;
  selectedBoardJson$: Observable<string>;
  editError: string;

  // For creating boards
  createForm: FormGroup;
  createError: string;

  // For saving the rank id
  rankCustomFieldIdForm: FormGroup;

  constructor(private _boardsService: BoardsService,
              appHeaderService: AppHeaderService) {
    appHeaderService.setTitle('Configuration');
  }

  ngOnInit() {
    this.loadBoards();
    this.createForm = new FormGroup({
      createJson: new FormControl('', Validators.required)
    });
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
          this.rankCustomFieldIdForm = new FormGroup({
            rankCustomFieldId: new FormControl(value.rankCustomFieldId, Validators.pattern('[0-9]*'))
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
    // TODO progress and errors
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
    if (!this.checkJson(json)) {
      this.createError = 'Contents must be valid json';
      return;
    }
    // TODO progress and errors
    this._boardsService.createBoard(json)
      .pipe(
        map<any, ConfigBoardsView>(data => this.toConfigBoardView(data)),
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
    if (!this.checkJson(boardJson)) {
      this.editError = 'Contents must be valid json';
      return;
    }
    // TODO progress and errors
    console.log('Saved edited board');
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
    // TODO handle progress and errors
    this._boardsService.saveRankCustomFieldId(this.rankCustomFieldIdForm.value.rankCustomFieldId)
      .pipe(
        take(1)
      )
      .subscribe(
        data => {
          // We need to subscribe here since http actions are cold observables
        }
      );
  }


  private checkJson(value: string): boolean {
    try {
      JSON.parse(value);
      return true;
    } catch (e) {
      return false;
    }
  }

  private toConfigBoardView(data: any): ConfigBoardsView {
    const boards: OrderedMap<number, any> =
      (<any[]>data['configs'])
        .reduce((om, boardCfg) => om.set(boardCfg['id'], boardCfg), OrderedMap<number, any>());

    return {
      boards: boards,
      canEditRankCustomFieldId: data['rank-custom-field']['edit'],
      rankCustomFieldId: data['rank-custom-field']['id']
    };
  }

}

interface ConfigBoardsView {
  boards: OrderedMap<number, any>;
  canEditRankCustomFieldId: boolean;
  rankCustomFieldId: number;
}
