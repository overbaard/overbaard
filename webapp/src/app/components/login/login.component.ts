import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {BoardsService} from '../../services/boards.service';
import {UrlService} from '../../services/url.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [BoardsService],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent implements OnInit {

  loginUrl: string;

  constructor(private _urlService: UrlService) {
  }

  ngOnInit(): void {
    this.loginUrl = this._urlService.jiraUrl + 'login.jsp';
  }
}

