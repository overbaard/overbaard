import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AppState} from './app-store';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {progressLogLoadingSelector} from './model/global/progress-log/progress-log.reducer';
import {MatToolbar} from '@angular/material';
import {TOOLBAR_HEIGHT} from './common/view-constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, AfterViewInit {

  readonly toolbarHeight: string = TOOLBAR_HEIGHT + 'px';

  loading$: Observable<boolean>;

  readonly navItems = [
    {name: 'Boards', route: '/boards'},
    {name: 'Config', route: '/config'}
  ];


  constructor(private _store: Store<AppState>) {
  }

  ngOnInit() {
    this.loading$ = this._store.select(progressLogLoadingSelector);
  }


  ngAfterViewInit(): void {
  }
}
