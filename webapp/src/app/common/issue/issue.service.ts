import { Injectable } from '@angular/core';
import {AppState} from '../../app-store';
import {Store} from '@ngrx/store';

@Injectable()
export class IssueService {

  constructor(private store: Store<AppState>) { }

}
