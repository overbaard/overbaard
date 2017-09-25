import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {BoardsService} from '../../../services/boards.service';
import {Observable} from 'rxjs/Observable';
import {Subscription} from 'rxjs/Subscription';
import 'rxjs/add/operator/catch';

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

  constructor(private _boardsService: BoardsService) { }

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
      )
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

