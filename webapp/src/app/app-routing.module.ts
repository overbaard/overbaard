import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {BoardsComponent} from './components/boards/boards.component';
import {BoardComponent} from './components/board/board.component';
import {ConfigurationComponent} from './components/config/configuration.component';
import {LoginComponent} from './components/login/login.component';
import {DbExplorerComponent} from './components/db-explorer/db-explorer.component';
import {AccessLogViewComponent} from './components/access-log/access-log.component';
import {FontMeasureComponent} from './components/font-measure/font-measure.component';
import {FontMeasureTableComponent} from './components/font-measure/font-measure-table.component';
import {ResetProgressGuard} from './services/router/reset-progress.guard';
import {ResetToolbarTitleGuard} from './services/router/reset-toolbar-title-guard';

const standardGuards: any[] = [ResetProgressGuard, ResetToolbarTitleGuard];

const routes: Routes = [
  {
    path: '', redirectTo: '/boards', pathMatch: 'full'
  },
  {
    path: 'boards', component: BoardsComponent, canActivate: standardGuards
  },
  {
    path: 'board', component: BoardComponent, canActivate: standardGuards
  },
  {
    path: 'config', component: ConfigurationComponent, canActivate: standardGuards
  },
  {
    path: 'login', component: LoginComponent, canActivate: standardGuards
  },
  {
    path: 'db-explorer', component: DbExplorerComponent, canActivate: standardGuards
  },
  {
    path: 'access-log', component: AccessLogViewComponent, canActivate: standardGuards
  },
  {
    path: 'font-measure', component: FontMeasureComponent, canActivate: standardGuards
  },
  {
    path: 'font-measure-table', component: FontMeasureTableComponent, canActivate: standardGuards
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
