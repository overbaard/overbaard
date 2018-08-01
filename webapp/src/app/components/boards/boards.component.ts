import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {BoardsService} from '../../services/boards.service';
import {Observable} from 'rxjs';
import {AppHeaderService} from '../../services/app-header.service';

@Component({
  selector: 'app-boards',
  templateUrl: './boards.component.html',
  styleUrls: ['./boards.component.scss'],
  providers: [BoardsService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoardsComponent implements OnInit, OnDestroy {

  boards$: Observable<any[]>;

  readonly rankViewParameter = 'rv';

  constructor(private _boardsService: BoardsService, private _appHeaderService: AppHeaderService) { }

  ngOnInit() {
    // TODO turn on/off progress indicator and log errors
    this.boards$ = this._boardsService.loadBoardsList(true);
    this._appHeaderService.setTitle('Boards List');
  }

  ngOnDestroy(): void {
  }
}

