import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {APP_BASE_HREF, HashLocationStrategy, LocationStrategy} from '@angular/common';
import {StoreModule} from '@ngrx/store';
import {reducer} from './app-store';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {environment} from '../environments/environment';
import {BoardsComponent} from './components/boards/boards.component';
import {RestUrlService} from './services/rest-url.service';
import {BoardComponent} from './components/board/board.component';
import {HttpClientModule} from '@angular/common/http';
import {AppHeaderService} from './services/app-header.service';
import { KanbanViewComponent } from './components/board/view/kanban-view/kanban-view.component';
import { RankViewComponent } from './components/board/view/rank-view/rank-view.component';
import { KanbanViewHeadersComponent } from './components/board/view/kanban-view/kanban-view-headers/kanban-view-headers.component';
import { KanbanViewHeaderRowComponent } from './components/board/view/kanban-view/kanban-view-headers/kanban-view-header-row.component';
import { KanbanViewHeaderComponent } from './components/board/view/kanban-view/kanban-view-headers/kanban-view-header.component';
import { KanbanViewColumnComponent } from './components/board/view/kanban-view/kanban-view-column/kanban-view-column.component';
import { BoardIssueComponent } from './components/board/issue/board-issue.component';
import { ControlPanelComponent } from './components/board/control-panel/control-panel.component';


@NgModule({
  declarations: [
    AppComponent,
    BoardsComponent,
    BoardComponent,
    KanbanViewComponent,
    RankViewComponent,
    KanbanViewHeadersComponent,
    KanbanViewHeaderRowComponent,
    KanbanViewHeaderComponent,
    KanbanViewColumnComponent,
    BoardIssueComponent,
    ControlPanelComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    StoreModule.provideStore(reducer),
    !environment.production ? StoreDevtoolsModule.instrumentOnlyWithExtension() : []
  ],
  providers: [
    {provide: APP_BASE_HREF, useValue: '/'},
    {provide: LocationStrategy, useClass: HashLocationStrategy},
    AppHeaderService,
    RestUrlService
  ],

  bootstrap: [AppComponent]
})
export class AppModule { }
