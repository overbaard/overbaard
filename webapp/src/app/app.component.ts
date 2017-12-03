import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {AppState} from './app-store';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {progressLogLoadingSelector} from './model/global/progress-log/progress-log.reducer';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {

  loading$: Observable<boolean>;

  constructor(private _store: Store<AppState>) {
  }

  ngOnInit() {
    this.loading$ = this._store.select(progressLogLoadingSelector);
  }
}
