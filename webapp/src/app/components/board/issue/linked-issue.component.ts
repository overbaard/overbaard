import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {LinkedIssue} from '../../../model/board/data/issue/linked-issue';
import {UrlService} from '../../../services/url.service';

@Component({
  selector: 'app-linked-issue',
  templateUrl: './linked-issue.component.html',
  styleUrls: ['./linked-issue.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LinkedIssueComponent implements OnInit {

  @Input()
  linkedIssue: LinkedIssue;

  url: string;
  tooltip: string;

  constructor(private _urlService: UrlService) {
  }

  ngOnInit(): void {
    this.url = this._urlService.jiraUrl + 'browse/' + this.linkedIssue.key;
    this.tooltip = `${this.linkedIssue.key}\n${this.linkedIssue.summary}\n${this.linkedIssue.stateName}`;
  }
}
