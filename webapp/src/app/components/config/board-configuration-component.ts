import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BoardsService} from '../../services/boards.service';
import {AppHeaderService} from '../../services/app-header.service';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/take';
import {OrderedMap} from 'immutable';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {Subject} from 'rxjs/Subject';

@Component({
  selector: 'app-board-configuration',
  templateUrl: './board-configuration-component.html',
  styleUrls: ['./board-configuration-component.scss'],
  providers: [BoardsService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardConfigurationComponent implements OnInit {
  @Input()
  configJson: string;

  @Input()
  canEdit: boolean;

  @Input()
  boardName: string

  @Input()
  jsonError: string;


  @Output()
  deleteBoard: EventEmitter<null> = new EventEmitter<null>();

  @Output()
  saveBoard: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  clearJsonError: EventEmitter<null> = new EventEmitter<null>();


  // To propagate the enum definition to the template
  readonly enumMode = Mode;
  mode = Mode.VIEW

  deleteForm: FormGroup;
  editForm: FormGroup;

  private customFieldIdForm: FormGroup;

  private _destroy$: Observable<null> = new Subject<null>()


  constructor(private _boardsService: BoardsService,
              appHeaderService: AppHeaderService) {
    appHeaderService.setTitle('Configuration');
  }

  ngOnInit() {
  }

  @Input()
  set saved(saved: boolean) {
    if (saved && this.mode === Mode.EDIT) {
      this.mode = Mode.VIEW;
    }
  }

  onToggleDelete(event: Event) {
    this.mode = this.mode !== Mode.DELETE ? Mode.DELETE : Mode.VIEW;
    if (this.mode === Mode.DELETE) {
      this.deleteForm = new FormGroup({
        boardName: new FormControl('', Validators.compose([Validators.required, (control: FormControl) => {
            if (this.boardName !== control.value) {
              return {'boardName' : true};
            }
          return null;
        }]))
      })
    }
    event.preventDefault();
  }

  onToggleEdit(event: Event) {
    this.clearJsonErrors();
    this.mode = this.mode !== Mode.EDIT ? Mode.EDIT : Mode.VIEW;
    if (this.mode === Mode.EDIT) {
      this.editForm = new FormGroup({
        editJson: new FormControl(this.configJson, Validators.required)
      });
    }
    event.preventDefault();
  }


  private formatAsJson(data: any): string {
    return JSON.stringify(data, null, 2);
  }

  private clearJsonErrors() {
    this.clearJsonError.emit(null);
  }

  onDeleteBoard() {
    this.deleteBoard.emit(null);
  }

  onSaveBoard() {
    this.saveBoard.emit(this.editForm.value.editJson);
  }


}

enum Mode {
  VIEW,
  EDIT,
  DELETE
}


