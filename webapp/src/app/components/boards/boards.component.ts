import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {BoardsService} from '../../services/boards.service';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import 'rxjs/add/operator/catch';
import {AppHeaderService} from '../../services/app-header.service';
import {VIEW_RANK} from '../board/board.component';
import {AppState} from '../../app-store';
import {Store} from '@ngrx/store';

@Component({
  selector: 'app-boards',
  templateUrl: './boards.component.html',
  styleUrls: ['./boards.component.scss'],
  providers: [BoardsService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardsComponent implements OnInit, OnDestroy {

  boards: Observable<any[]>;

  rankViewParameter = VIEW_RANK;

  constructor(private _boardsService: BoardsService, private _appHeaderService: AppHeaderService) { }

  ngOnInit() {
    // TODO turn on/off progress indicator and log errors
    this.boards = this._boardsService.loadBoardsList(true);
    this._appHeaderService.setTitle('Boards List');
  }

  ngOnDestroy(): void {
  }
}

