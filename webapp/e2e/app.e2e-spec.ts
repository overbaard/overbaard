import { OverbaardPage } from './app.po';

describe('overbaard App', () => {
  let page: OverbaardPage;

  beforeEach(() => {
    page = new OverbaardPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
