import {AfterViewInit, ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
import 'rxjs/add/operator/take';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/catch';
import {FontSizeTable, FontSizeTableService} from '../../services/font-size-table.service';
import {Dictionary} from '../../common/dictionary';
import {SAME_CHAR_WIDTH_LOOKUP_TABLE} from './lookup-table';

@Component({
  selector: 'app-font-measure',
  template: `
    <canvas #myCanvas width="0" height="0"></canvas>
    <div *ngFor="let test of testStrings" [ngStyle]="testStyle"><span>{{test}}</span></div>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FontMeasureComponent implements OnInit, AfterViewInit {

  @ViewChild('myCanvas') myCanvas;

  // To play with font measurements, add strings and the size (px) here. If you want a different size from
  // 12 and 14, you need to call createTableForFontSize() with the desired size in ngAfterViewInit.
  // Then open http://localhost:4200/#/font-measure to see the console output and compare it with the real measurements
  // done by the browser.
  readonly testStrings: string[] = []; // e.g. ['string 1', 'string 2']
  readonly testTextSize = 12;
  readonly testStyle: any  = {'font-size': `${this.testTextSize}px`}

  // Generated using FontMeasureTable
  private _sameCharLookupTable: Dictionary<string> = SAME_CHAR_WIDTH_LOOKUP_TABLE;


  constructor(private _fontSizeTable: FontSizeTableService) {
  }

  ngOnInit(): void {
  }


  ngAfterViewInit(): void {
    console.log('Starting font calculation');
    this._fontSizeTable.startModification();

    this._fontSizeTable.setSameCharTable(this._sameCharLookupTable);

    this.createTableForFontSize(12);
    this.createTableForFontSize(14);

    this._fontSizeTable.completeModification();

    // Leave this in, this will only happen an effect if this.testText has some entries
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
      // console.log(`'${char}': ${charSize}`);
      size += charSize;
    }
    console.log(`size of '${s}': ${size}`);
  }

  private createTableForFontSize(size: number) {
    const canvas: HTMLCanvasElement = this.myCanvas.nativeElement;
    const context: CanvasRenderingContext2D = canvas.getContext('2d');
    context.font = `${size}px Roboto`;

    for (const char of Object.keys(this._sameCharLookupTable)) {
      const metrics: TextMetrics = context.measureText(char);
      const width: number = metrics.width;
      this._fontSizeTable.addItem(`${size}px`, char, width);
    }
  }
}
