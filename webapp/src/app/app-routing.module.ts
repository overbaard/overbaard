import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {BoardsComponent} from './components/boards/boards.component';
import {BoardComponent} from './components/board/board.component';
import {ConfigurationComponent} from './components/config/configuration.component';
import {LoginComponent} from './components/login/login.component';
import {DbExplorerComponent} from './components/db-explorer/db-explorer.component';

const routes: Routes = [
  {
    path: '', redirectTo: '/boards', pathMatch: 'full'
  },
  {
    path: 'boards', component: BoardsComponent,
  },
  {
    path: 'board', component: BoardComponent
  },
  {
    path: 'config', component: ConfigurationComponent
  },
  {
    path: 'login', component: LoginComponent
  }/*,
  // THis should never be enabled - it is for debugging only
  {
    path: 'db-explorer', component: DbExplorerComponent
  }*/
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
