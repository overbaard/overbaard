import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, QueryList,
  ViewChildren
} from '@angular/core';
import 'rxjs/add/operator/take';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/catch';
import {List} from 'immutable';
import {FontSizeTableService} from '../../services/font-size-table.service';
import {EXTRA_ITEM, ISSUE_SUMMARY_NAME} from '../../view-model/board/issue-height-calculator';
import {Dictionary} from '../../common/dictionary';

/**
 * Used to create a lookup table for characters.
 * It currently does the following Unicode Blocks from (https://en.wikipedia.org/wiki/Unicode_block):
 * U+0000..U+007F	Basic Latin[g]	128	128	Latin (52 characters), Common (76 characters)
 * U+0080..U+00FF	Latin-1 Supplement[h]	128	128	Latin (64 characters), Common (64 characters)
 * U+0100..U+017F	Latin Extended-A	128	128	Latin
 * U+0180..U+024F	Latin Extended-B	208	208	Latin
 * U+0250..U+02AF	IPA Extensions	96	96	Latin
 * U+02B0..U+02FF	Spacing Modifier Letters	80	80	Bopomofo (2 characters), Latin (14 characters), Common (64 characters)
 * U+0300..U+036F	Combining Diacritical Marks	112	112	Inherited
 * U+0370..U+03FF	Greek and Coptic	144	135	Coptic (14 characters), Greek (117 characters), Common (4 characters)
 * U+0400..U+04FF	Cyrillic	256	256	Cyrillic (254 characters), Inherited (2 characters)
 * U+0500..U+052F	Cyrillic Supplement
 *
 */
@Component({
  selector: 'app-font-measure-table',
  template: `
    <div
      *ngFor="let character of characters"
      #characterHolder>
      <div
        class="font-size: 10px">
        <span class="class">{{character}}</span>
      </div>
    </div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FontMeasureTableComponent implements OnInit, AfterViewInit {

  @ViewChildren('characterHolder')
  characterHolders: QueryList<ElementRef>;

  characters: string[] = [];

  constructor() {
  }

  ngOnInit(): void {
    const characters: string[] = [];
    for (let i = 33 ; i <= 1327 /* 0x052F */ ; i++) {
      characters.push(String.fromCharCode(i));
    }

    for (const char of characters) {
      let arr: string = char;
      let arr4: string;

      for (let i = 0 ; i < 5 ; i++) {
        arr += arr;
        if (i === 1) {
          arr4 = arr;
        }
      }
      const arr32: string = arr;
      arr = arr32 + arr32 + arr32 + arr4;
      this.characters.push(arr);
    }
  }

  ngAfterViewInit(): void {
    console.log('Starting font calculation');
    const elements: ElementRef[] = this.characterHolders.toArray();

    // Group the characters into groups of widths
    const groups: Dictionary<string[]> = {};

    for (const element of elements) {
      const divEl: HTMLElement = element.nativeElement.querySelector('div');
      const span: HTMLElement = divEl.querySelector('span');
      const text: string = span.textContent;
      const character = text.charAt(0);
      const width: number = span.offsetWidth / text.length;

      console.log(character + ': ' + width);
      this.addCharacter(groups, character, width);
    }

    const lookupTable: Dictionary<string> = this.createLookupTable(groups);
    console.log(lookupTable)
    console.log(JSON.stringify(lookupTable));

  }

  addCharacter(groups: Dictionary<string[]>, character: string, width: number) {
    const widthAsString: string = width.toString();
    let arr: string[] = groups[widthAsString];
    if (!arr) {
      arr = [];
      groups[widthAsString] = arr;
    }
    arr.push(character);
  }

  createLookupTable(groups: Dictionary<string[]>): Dictionary<string> {
    const lookupTable: Dictionary<string> = {};
    for (const key of Object.keys(groups)) {
      const arr: string[] = groups[key];
      const base: string = arr[0];
      for (const character of arr) {
        lookupTable[character] = base;
      }
    }
    return lookupTable;
  }
}


