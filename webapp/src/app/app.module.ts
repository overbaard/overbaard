import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {APP_BASE_HREF, HashLocationStrategy, LocationStrategy} from '@angular/common';
import {StoreModule} from '@ngrx/store';
import {metaReducers, reducers} from './app-store';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {environment} from '../environments/environment';
import {BoardsComponent} from './components/boards/boards.component';
import {RestUrlService} from './services/rest-url.service';
import {BoardComponent} from './components/board/board.component';
import {AppHeaderService} from './services/app-header.service';
import {KanbanViewComponent} from './components/board/view/kanban-view/kanban-view.component';
import {RankViewComponent} from './components/board/view/rank-view/rank-view.component';
import {ControlPanelComponent} from './components/board/control-panel/control-panel.component';
import {KanbanHeadersContainerComponent} from './components/board/view/kanban-view/kanban-view-headers/kanban-headers-container.component';
import {KanbanHeaderGroupComponent} from './components/board/view/kanban-view/kanban-view-headers/kanban-header-group.component';
import {KanbanHeaderContentComponent} from './components/board/view/kanban-view/kanban-view-headers/kanban-header-content.component';
import {KanbanNormalViewComponent} from './components/board/view/kanban-view/kanban-normal-view/kanban-normal-view.component';
import {KanbanViewColumnGroupComponent} from './components/board/view/kanban-view/kanban-view-column/kanban-view-column-group.component';
import {KanbanViewColumnComponent} from './components/board/view/kanban-view/kanban-view-column/kanban-view-column.component';
import {BoardIssueComponent} from './components/board/issue/board-issue.component';
import {KanbanSwimlaneViewComponent} from './components/board/view/kanban-view/kanban-view-swimlane/kanban-swimlane-view.component';
import {KanbanSwimlaneEntryComponent} from './components/board/view/kanban-view/kanban-view-swimlane/kanban-swimlane-entry.component';
import {HttpClientModule} from '@angular/common/http';
import {ConfigurationComponent} from './components/config/configuration.component';
import {BoardConfigurationComponent} from './components/config/board-configuration-component';

@NgModule({
  declarations: [
    AppComponent,
    BoardsComponent,
    BoardComponent,
    ConfigurationComponent,
    BoardConfigurationComponent,
    KanbanViewComponent,
    KanbanNormalViewComponent,
    KanbanViewColumnGroupComponent,
    KanbanViewColumnComponent,
    KanbanSwimlaneViewComponent,
    KanbanSwimlaneEntryComponent,
    RankViewComponent,
    KanbanHeaderContentComponent,
    KanbanHeaderGroupComponent,
    KanbanHeadersContainerComponent,
    BoardIssueComponent,
    ControlPanelComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule,
    AppRoutingModule,
    StoreModule.forRoot(reducers, { metaReducers }),
    !environment.production ? StoreDevtoolsModule.instrument({ maxAge: 50 }) : []
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
