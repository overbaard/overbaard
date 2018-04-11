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

/**
 * canActivate: [ResetProgress] is to reset the progress spinner when e.g. pressing the back button
 */
const routes: Routes = [
  {
    path: '', redirectTo: '/boards', pathMatch: 'full'
  },
  {
    path: 'boards', component: BoardsComponent, canActivate: [ResetProgressGuard]
  },
  {
    path: 'board', component: BoardComponent, canActivate: [ResetProgressGuard]
  },
  {
    path: 'config', component: ConfigurationComponent, canActivate: [ResetProgressGuard]
  },
  {
    path: 'login', component: LoginComponent, canActivate: [ResetProgressGuard]
  },
  {
    path: 'db-explorer', component: DbExplorerComponent, canActivate: [ResetProgressGuard]
  },
  {
    path: 'access-log', component: AccessLogViewComponent, canActivate: [ResetProgressGuard]
  },
  {
    path: 'font-measure', component: FontMeasureComponent, canActivate: [ResetProgressGuard]
  },
  {
    path: 'font-measure-table', component: FontMeasureTableComponent, canActivate: [ResetProgressGuard]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
