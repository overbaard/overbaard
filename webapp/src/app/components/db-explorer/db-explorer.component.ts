import {Component} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {AppHeaderService} from '../../services/app-header.service';
import {UrlService} from '../../services/url.service';
import {Subject, BehaviorSubject} from 'rxjs';
import {take, timeout} from 'rxjs/operators';

/**
 * Backing class for functionality to explore the DB
 */
@Component({
    selector: 'app-db-explorer',
    templateUrl: './db-explorer.component.html'
})
export class DbExplorerComponent {
  sqlForm: FormGroup;
  error$: Subject<string> = new BehaviorSubject<string>(null);
  result$: Subject<any> = new BehaviorSubject<any>(null);

  constructor(appHeaderService: AppHeaderService, private _urlService: UrlService, private _httpClient: HttpClient) {
    appHeaderService.setTitle('DB Explorer');
    this.sqlForm = new FormGroup({
      'sql': new FormControl(null, Validators.required)
    });
  }


  executeSql() {
    this.error$.next(null);
    const url = UrlService.OVERBAARD_REST_PREFIX + '/db-explorer';
    const path: string = this._urlService.caclulateRestUrl(url);


    const headers: HttpHeaders = this.createHeaders();
    const payload: any = {sql: this.sqlForm.value.sql};

    return this._httpClient.post(path, JSON.stringify(payload), {headers: headers})
      .pipe(
        timeout(60000),
        take(1),
      )
      .subscribe(
        (data: string) => {
          console.log(data);
          this.result$.next(data);
        },
        (err: HttpErrorResponse) => {
          let msg = null;
          if (err instanceof Error) {
            msg = (<Error>err).message;
          } else {
            msg = err.error.message;
          }
          this.error$.next(msg);
          this.result$.next(null);
        }
      );
  }

  private createHeaders(): HttpHeaders {
    return new HttpHeaders()
      .append('Content-Type', 'application/json');
  }

}
