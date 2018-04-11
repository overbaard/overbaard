import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';
import {Observable} from 'rxjs/Observable';
import {ProgressLogService} from '../progress-log.service';


@Injectable()
export class ResetProgressGuard implements CanActivate {

  constructor(private readonly _progressLog: ProgressLogService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    this._progressLog.resetForNewRoute();
    return true;
  }

}
