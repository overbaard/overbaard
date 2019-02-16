import {Title} from '@angular/platform-browser';
import {Injectable} from '@angular/core';

@Injectable()
export class ToolbarTitleService {
  private _title: string;

  constructor() {
  }

  get title(): string {
    return this._title;
  }

  set title(value: string) {
    this._title = value;
  }
}
