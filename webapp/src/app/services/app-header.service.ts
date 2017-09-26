import {Title} from "@angular/platform-browser";
import {Injectable} from "@angular/core";
import {Observable, Subject} from "rxjs/Rx";

@Injectable()
export class AppHeaderService {
    constructor(private _title: Title) {
    }

    setTitle(title: string) {
        this._title.setTitle('Overbård - ' + title);
    }
}
