import {AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {FontSizeTable, FontSizeTableService} from '../../services/font-size-table.service';
import {Dictionary} from '../../common/dictionary';
import {SAME_CHAR_WIDTH_LOOKUP_TABLE} from './lookup-table';

@Component({
  selector: 'app-font-measure',
  template: `
    <canvas #myCanvas width="0" height="0"></canvas>
    <div *ngFor="let test of testStrings" [ngStyle]="testStyle"><span>{{test}}</span></div>
    <!-- To figure out minimum font size -->
    <div *ngFor="let size of sizeArray"
      [ngStyle]="{'font-size': size + 'px'}"
      #sizeExamples><span>0000000000</span></div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FontMeasureComponent implements OnInit, AfterViewInit {

  @ViewChild('myCanvas') myCanvas: ElementRef;

  @ViewChildren('sizeExamples') sizeExamples: QueryList<ElementRef>;

  // To play with font measurements, add strings and the size (px) here. If you want a different size from
  // 12 and 14, you need to call createTableForFontSize() with the desired size in ngAfterViewInit.
  // Then open http://localhost:4200/#/font-measure to see the console output and compare it with the real measurements
  // done by the browser.
  readonly testStrings: string[] = []; // e.g. ['string 1', 'string 2']
  readonly testTextSize = 12;
  readonly testStyle: any  = {'font-size': `${this.testTextSize}px`}

  // Generated using FontMeasureTable
  private _sameCharLookupTable: Dictionary<string> = SAME_CHAR_WIDTH_LOOKUP_TABLE;

  // Array used to determine the minimum font size
  readonly sizeArray: number[] = [];

  constructor(private _fontSizeTable: FontSizeTableService) {
    for (let i = 10 ; i < 31 ; i++) {
      this.sizeArray.push(i);
    }
  }

  ngOnInit(): void {
  }


  ngAfterViewInit(): void {
    console.log('Starting font calculation');
    this._fontSizeTable.startModification();

    this._fontSizeTable.setSameCharTable(this._sameCharLookupTable);

    // We only determine the minimum font size on initial load. Someone changing the minimum font
    // size while viewing the page seems like a real corner case, and they can always reload if things
    // look strange.
    const minimumFontSize: number = this.determineMinimumFontSize();

    this.createTableForFontSize(12, minimumFontSize);
    this.createTableForFontSize(14, minimumFontSize);

    this._fontSizeTable.completeModification();

    // Leave this in, this will only have an effect if this.testText has some entries
    this.checkTestStrings(this._fontSizeTable.getTable(this.testTextSize + 'px'));

    console.log('Font calculation done');
  }

  private checkTestStrings(widths: any) {
    for (const test of this.testStrings) {
      this.measureItem(test);
    }
  }

  private measureItem(s: string) {
    const table: FontSizeTable = this._fontSizeTable.getTable(this.testTextSize + 'px');
    let size = 0;
    for (let i = 0 ; i < s.length ; i++) {
      const char: string = s.charAt(i);
      const charSize: number = table.getWidth(char);
      if (i < 127) {
        console.log(`'${char}': ${charSize}`);
      }
      size += charSize;
    }
    console.log(`size of '${s}': ${size}`);
  }

  private createTableForFontSize(size: number, minimumFontSize: number) {
    const canvas: HTMLCanvasElement = this.myCanvas.nativeElement;
    const context: CanvasRenderingContext2D = canvas.getContext('2d');
    let useSize: number = size;
    if (size < minimumFontSize) {
      console.log(`${size}px is smaller than the minimum font size of ${minimumFontSize}px. ` +
        `Calculating the ${size}px size table using ${minimumFontSize}px instead`);
      useSize = minimumFontSize;
    }
    context.font = `${useSize}px Arial`;

    for (const char of Object.keys(this._sameCharLookupTable)) {
      const metrics: TextMetrics = context.measureText(char);
      const width: number = metrics.width;
      // if (char.charCodeAt(0) < 128) {
      //   console.log(`${useSize}px - '${char}': ${width}`);
      // }
      this._fontSizeTable.addItem(`${size}px`, char, width);
    }
  }

  private determineMinimumFontSize(): number {
    const elements: ElementRef[] = this.sizeExamples.toArray();

    let lastRenderedFontSize: number;
    let i = 0;
    for (const element of elements) {
      const htmlEl: HTMLElement = element.nativeElement;
      const span: HTMLElement = htmlEl.querySelector('span');

      const renderedFontSize: number = span.offsetWidth / 10;

      if (i === 0) {
        lastRenderedFontSize = renderedFontSize;
      } else {
        if (lastRenderedFontSize !== renderedFontSize) {
          const minimumFontSize: number = this.sizeArray[i - 1];
          // console.log(`Minimum font size: ${minimumFontSize}`)
          return minimumFontSize;
        }
      }

      i++;
    }
    return -1;
  }
}
