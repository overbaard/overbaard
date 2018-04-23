import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {AppState} from './app-store';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {
  externallyDismissFirstMessageSelector,
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
import {LogEntry} from './model/global/progress-log/log-entry';
import {Router} from '@angular/router';
import {filter, take, takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, AfterViewInit {

  readonly toolbarHeight: number = TOOLBAR_HEIGHT;

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
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(logEntry => {
        this.handleLogEntry(logEntry);
      });

    this._store
      .select(notLoggedInSelector)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(notLoggedIn => {
        if (notLoggedIn) {
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

  navItemTrackByFn(index: number, navItem: any) {
    return navItem['name'];
  }


  get jiraUrl(): string {
    return this._urlService.jiraUrl;
  }

  private handleLogEntry(logEntry: LogEntry) {
    if (logEntry) {
      this.openSnackbar(logEntry);
      const ref: MatSnackBarRef<SimpleSnackBar> = this.openSnackbar(logEntry);

      const dismissed: Subject<void> = new Subject<void>();
      let externallyDismissed = false;

      // Listen for externally dismissed messages
      this._store.select(externallyDismissFirstMessageSelector)
        .pipe(
          takeUntil(dismissed),
          filter(isDismissed => isDismissed)
        )
        .subscribe(
          data => {
            externallyDismissed = true;
            this._store.dispatch(ProgressLogActions.createResetExternallyFirstMessage());
            ref.dismiss();
          });

      // Listen for clicks on the dismiss button in the snackbar
      ref.afterDismissed()
        .pipe(
          take(1)
        )
        .subscribe(data => {
        // Clear the message once we've finished displaying it
          this._store.dispatch(ProgressLogActions.createClearFirstMessage());
          dismissed.next(null);
      });
    }

  }
}
