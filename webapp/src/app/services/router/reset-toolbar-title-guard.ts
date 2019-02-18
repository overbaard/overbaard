import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';
import {ProgressLogService} from '../progress-log.service';
import {Observable} from 'rxjs';
import {AppHeaderService} from '../app-header.service';
import {ToolbarTitleService} from '../toolbar-title.service';
import {Injectable} from '@angular/core';

@Injectable()
export class ResetToolbarTitleGuard implements CanActivate {
  constructor(private readonly _toolbarTitleService: ToolbarTitleService) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    this._toolbarTitleService.title = null;
    return true;
  }
}
