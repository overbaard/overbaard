import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {BoardsService} from '../../services/boards.service';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import 'rxjs/add/operator/catch';
import {AppHeaderService} from '../../services/app-header.service';
import {VIEW_RANK} from '../board/board.component';

@Component({
  selector: 'app-boards',
  templateUrl: './boards.component.html',
  styleUrls: ['./boards.component.scss'],
  providers: [BoardsService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardsComponent implements OnInit, OnDestroy {

  boards: Observable<any[]>;
  subscription: Subscription;
  rankViewParameter = VIEW_RANK;

  constructor(private _boardsService: BoardsService, private _appHeaderService: AppHeaderService) { }

  ngOnInit() {
    // TODO turn on progress indicator
    this.boards = this._boardsService.loadBoardsList(true);

    this.subscription = this.boards
      .subscribe(
        value => {},
        error => {
          // TODO turn off progress indicator
        },
        () => {
          // TODO turn off progress indicator
        }
      );

    this._appHeaderService.setTitle('Boards List');
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

