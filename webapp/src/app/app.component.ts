import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AppState} from './app-store';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {progressLogLoadingSelector} from './model/global/progress-log/progress-log.reducer';
import {MatToolbar} from '@angular/material';
import {TOOLBAR_HEIGHT} from './common/view-constants';
import {VersionService} from './services/version.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, AfterViewInit {

  readonly toolbarHeight: string = TOOLBAR_HEIGHT + 'px';

  loading$: Observable<boolean>;
  version$: Observable<string>

  readonly navItems = [
    {name: 'Boards', route: '/boards', icon: 'business'},
    {name: 'Config', route: '/config', icon: 'settings'}
  ];


  constructor(private _store: Store<AppState>, private _versionService: VersionService) {
  }

  ngOnInit() {
    this.loading$ = this._store.select(progressLogLoadingSelector);
    this.version$ = this._versionService.getVersion();
  }


  ngAfterViewInit(): void {
  }
}
