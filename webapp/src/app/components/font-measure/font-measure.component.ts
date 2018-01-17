import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, QueryList,
  ViewChildren
} from '@angular/core';
import 'rxjs/add/operator/take';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/catch';
import {List} from 'immutable';

@Component({
  selector: 'app-font-measure',
  template: `
    <div
      *ngFor="let character of characters"
      #characterHolder>
      <div
        *ngFor="let setting of settings"
        [ngClass]="setting.cssClass ? setting.cssClass : ''"
        [ngStyle]="setting.style ? setting.style : {}">
        <span class="class">{{character}}</span>
      </div>


    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FontMeasureComponent implements OnInit, AfterViewInit {

  settings: List<Setting> =
    List<Setting>([Setting.fromClass('mat-caption'), Setting.fromStyle({'font-size': '24px'})]);
  characters: string[] = [];

  @ViewChildren('characterHolder')
  characterHolders: QueryList<ElementRef>;


  ngOnInit(): void {
    const characters: string[] = [];
    for (let i = 33 ; i < 255 ; i++) {
      characters.push(String.fromCharCode(i));
    }
    for (const char of characters) {
      let arr: string = char;
      for (let i = 0 ; i < 6 ; i++) {
        arr += arr;
      }
      this.characters.push(arr);
      console.log(arr.length);
    }
  }


  ngAfterViewInit(): void {
    const elements: ElementRef[] = this.characterHolders.toArray();
    for (const element of elements) {
      const childDivs: NodeListOf<HTMLElement> = element.nativeElement.querySelectorAll('div');
      let character: string;
      for (let i = 0 ; i < childDivs.length ; i++) {
        const divEl: HTMLElement = childDivs.item(i);
        const span: HTMLElement = divEl.querySelector('span');
        const text: string = span.textContent;
        if (i === 0) {
          character = text.charAt(0);
        }

        console.log(`${character} - (${this.settings.get(i)}): + ${span.offsetWidth / text.length}`);
      }
    }
  }
}

export class Setting {
  static fromClass(cssClass: string) {
    return new Setting(cssClass, null);
  }

  static fromStyle(style: any) {
    return new Setting(null, style);
  }

  constructor(public cssClass: string, public style: any) {
  }

  toString(): string {
    if (this.cssClass) {
      return `class=${this.cssClass}`;
    } else {
      return JSON.stringify(this.style);
    }
  }
}
