import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AppState} from './app-store';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {
  notLoggedInSelector,
  ProgressLogActions,
  progressLogCurrentMessageSelector,
  progressLogLoadingSelector
} from './model/global/progress-log/progress-log.reducer';
import {MatSnackBar, MatSnackBarConfig, MatSnackBarRef, MatToolbar, SimpleSnackBar} from '@angular/material';
import {TOOLBAR_HEIGHT} from './common/view-constants';
import {VersionService} from './services/version.service';
import {UrlService} from './services/url.service';
import {Subject} from 'rxjs/Subject';
import 'rxjs/add/operator/takeUntil'
import {LogEntry} from './model/global/progress-log/log-entry';
import {Router} from '@angular/router';

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

  private destroy$: Subject<void> = new Subject<void>();

  readonly navItems = [
    {name: 'Boards', route: '/boards', icon: 'business'},
    {name: 'Config', route: '/config', icon: 'settings'}
  ];


  constructor(
    private _router: Router,
    private _store: Store<AppState>, private _versionService: VersionService,
    private _urlService: UrlService, private _snackBar: MatSnackBar) {
  }

  ngOnInit() {
    this.loading$ = this._store.select(progressLogLoadingSelector);
    this.version$ = this._versionService.getVersion();

    this._store
      .select(progressLogCurrentMessageSelector)
      .takeUntil(this.destroy$)
      .subscribe(logEntry => {
        if (logEntry) {
          this.openSnackbar(logEntry);
          const ref: MatSnackBarRef<SimpleSnackBar> = this.openSnackbar(logEntry);
          ref.afterDismissed().take(1).subscribe(data => {
            // Clear the message once we've finished displaying it
            this._store.dispatch(ProgressLogActions.createClearFirstMessage());
          });
        }
      });

    this._store
      .select(notLoggedInSelector)
      .takeUntil(this.destroy$)
      .subscribe(notLoggedIn => {
        console.log('----> not logged in: ' + notLoggedIn);
        if (notLoggedIn) {
          console.log('---> navigating to loging page');
          this._router.navigate(['/login']);
        }
      });
  }


  private openSnackbar(logEntry: LogEntry): MatSnackBarRef<SimpleSnackBar> {
    const config: MatSnackBarConfig = new MatSnackBarConfig();
    config.verticalPosition = 'bottom';
    config.horizontalPosition = 'center';
    if (!logEntry.error) {
      config.duration = 4000;
    }

    // TODO For some reason this does not work
    config.panelClass = logEntry.error ? ['error-log'] : undefined;
    return this._snackBar.open(logEntry.message, 'Close', config);
  }

  ngAfterViewInit(): void {
  }

  /**
   * @see UrlService.localImageUrl()
   */
  localImageUrl(name: string): string {
    return this._urlService.localImageUrl(name);
  }

  get jiraUrl(): string {
    return this._urlService.jiraUrl;
  }
}
