import {AfterViewInit, ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
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
    <canvas #myCanvas width="0" height="0"></canvas>
    <!--<div *ngFor="let test of testStrings" style="font-size: 10px"><span>{{test}}</span></div>-->
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FontMeasureTableComponent implements OnInit, AfterViewInit {

  // Leave this commented out so we can easily reenable
  // testStrings: string[] = ['One', 'Two', 'One Two', 'WFCORE-1234'];

  @ViewChild('myCanvas') myCanvas;

  constructor() {
  }

  ngOnInit(): void {
  }

  times10(s: string): string {
    s = s + s + s + s + s;
    s += s;
    return s;
  }

  ngAfterViewInit(): void {
    // Leave this commented out so we can easily reenable
    // const widths: any = {};
    const canvas: HTMLCanvasElement = this.myCanvas.nativeElement;
    const context: CanvasRenderingContext2D = canvas.getContext('2d');

    // Group the characters into groups of widths
    const groups: Dictionary<string[]> = {};
    context.font = '10px Arial';
    for (let i = 32 ; i <= 1327 ; i++) {
      const char: string = String.fromCharCode(i);
      const metrics: TextMetrics = context.measureText(char);
      const width: number = metrics.width;
      // console.log(`${char}: ${width}`);

      this.addCharacter(groups, char, width);
      // widths[char] = width;
      /* Double width is smaller for some characters
      metrics = context.measureText(char + char);
      if (metrics.width / 2 !== width) {
        console.log('Double width is not the same for \'' + char + '\': metrics.width / 2);
      }*/
    }
    console.log(groups);
    console.log(Object.keys(groups).length);

    const lookupTable: Dictionary<string> = this.createLookupTable(groups);
    console.log(lookupTable)
    console.log(JSON.stringify(lookupTable));

    // Leave this commented out so we can easily reenable
    // this.checkTestStrings(widths);
  }

  // Leave this commented out so we can easily reenable
  // private checkTestStrings(widths: any) {
  //   for (const test of this.testStrings) {
  //     this.measureItem(widths, test);
  //   }
  // }
  //
  // private measureItem(widths: any, s: string) {
  //   let size = 0;
  //   for (let i = 0 ; i < s.length ; i++) {
  //     const char: string = s.charAt(i);
  //     const charSize: number = widths[char];
  //     // console.log(`'${char}': ${charSize}`);
  //     size += charSize;
  //   }
  //   console.log(`size of '${s}': ${size}`);
  // }

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


