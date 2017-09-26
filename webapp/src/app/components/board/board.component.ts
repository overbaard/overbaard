import {Component, OnInit} from '@angular/core';
import {Dictionary} from '../../common/utils/dictionary';
import {ActivatedRoute} from '@angular/router';
import {AppHeaderService} from '../../services/app-header.service';

const VIEW_KANBAN = 'kbv';
export const VIEW_RANK = 'rv';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss']
})
export class BoardComponent implements OnInit {

  private boardCode: string;
  private view: string = VIEW_KANBAN;
  private _wasBacklogForced = false;

  constructor(route: ActivatedRoute, private _appHeaderService: AppHeaderService) {
    const queryParams: Dictionary<string> = route.snapshot.queryParams;
    const code: string = queryParams['board'];
    if (!code) {
      return;
    }
    this.boardCode = code;

    const view = queryParams['view'];
    if (view) {
      this.view = view;
      if (view === VIEW_RANK) {
        this._wasBacklogForced = true;
      }
    }

    let title = `Board ${code}`;
    if (view === VIEW_RANK) {
      title += ' (rank)';
    }
    this._appHeaderService.setTitle(title);

    // TODO push more querystring things into the state
  }

  ngOnInit() {

  }

}
