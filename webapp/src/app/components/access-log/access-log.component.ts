import {Progress, ProgressLogService} from '../../services/progress-log.service';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {UrlService} from '../../services/url.service';
import {Component, OnInit} from '@angular/core';
import {List, Map} from 'immutable';

@Component({
    selector: 'app-access-log',
    templateUrl: './access-log.component.html',
    styleUrls: ['./access-log.component.scss']
})
export class AccessLogViewComponent implements OnInit {

  accessData: AccessLogData;

  constructor(private _progressLog: ProgressLogService, private _urlService: UrlService, private _http: HttpClient) {
  }

  ngOnInit(): void {
    this.getAccessLog();
  }

  private getAccessLog() {
    const url = UrlService.OVERBAARD_REST_PREFIX + '/access-log';
    const path: string = this._urlService.caclulateRestUrl(url);
    const progress: Progress = this._progressLog.startUserAction();
    return this._http.get(path)
      .timeout(60000)
      .subscribe(
        (data: AccessEntry[]) => {
          const accessLogData: AccessLogData = this.processRawAcceessLog(data);
          this.accessData = accessLogData;
          progress.complete();
        },
        (err: HttpErrorResponse) => {
          let msg = null;
          if (err instanceof Error) {
            msg = (<Error>err).message;
          } else {
            msg = err.error.message;
          }
          progress.logError(msg);
        }
      )
  }

  private processRawAcceessLog(data: AccessEntry[]): AccessLogData {
    // We don't care too much about immutability etc.of the values here
    const lastTime = data[0].time;
    const firstTime = data[data.length - 1].time;

    const list: List<AccessEntry> = List<AccessEntry>(data);
    const map: Map<string, UserAccessSummary> = Map<string, UserAccessSummary>().withMutations(mutable => {
      list.forEach(access => {
        const user: User = access.user;
        const summary: UserAccessSummary = mutable.get(user.key, {user: user, count: 0});
        summary.count = summary.count + 1;
        mutable.set(user.key, summary);
      });
    });

    const summaries: List<UserAccessSummary> = map.sort(
      (a, b) => a.user.name.localeCompare(b.user.name)).toList();

    return {
      accesses: list,
      summaries: summaries,
      lastTime: lastTime,
      firstTime: firstTime
    }
  }
}

export interface AccessLogData {
  accesses: List<AccessEntry>;
  summaries: List<UserAccessSummary>;
  lastTime: Date;
  firstTime: Date;
}

export interface AccessEntry {
  user: User;
  agent: string;
  board: string;
  time: Date;
}

export interface User {
  key: string;
  name: string;
}

export interface UserAccessSummary {
  user: User;
  count: number;
}

