import {List} from 'immutable';
import {Header} from '../../../model/board/data/header/header';
import {HeadersView, HeaderView} from './headers-view';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

const DEFAULT_HEADERS: HeadersView = {
  headers: List<List<HeaderView>>(),
  states: List<string>()
};

const DEFAULT_HEADER: HeaderView = {
  name: '',
  abbreviated: '',
  rows: 1,
  cols: 1,
  wip: 0,
  backlog: false,
  states: List<number>(),
  visibleColumn: true,
  totalIssues: 0,
  visibleIssues: 0
}

interface HeadersViewRecord extends TypedRecord<HeadersViewRecord>, HeadersView {
}

interface HeaderViewRecord extends TypedRecord<HeaderViewRecord>, HeaderView {
}

const HEADERS_FACTORY = makeTypedFactory<HeadersView, HeadersViewRecord>(DEFAULT_HEADERS);
const HEADER_FACTORY = makeTypedFactory<HeaderView, HeaderViewRecord>(DEFAULT_HEADER);
export const initialHeadersView = HEADERS_FACTORY(DEFAULT_HEADERS);

export class HeaderViewUtil {

  static creaateHeadersView(headers: List<List<HeaderView>>, states: List<string>): HeadersViewRecord {
    return HEADERS_FACTORY({
      headers: headers,
      states: states
    });
  }

  static createHeaderView(header: Header, visibleColumn: boolean, totalIssues: number, visibleIssues: number): HeaderViewRecord {
    return HEADER_FACTORY({
      name: header.name,
      abbreviated: header.abbreviated,
      rows: header.rows,
      cols: header.cols,
      wip: header.wip,
      backlog: header.backlog,
      states: header.states,
      visibleColumn: visibleColumn,
      totalIssues: totalIssues,
      visibleIssues: visibleIssues
    });
  }

}
