import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {BoardsComponent} from './components/smart/boards/boards.component';
import {BoardComponent} from './components/smart/board/board.component';

const routes: Routes = [
  {
    path: 'boards', component: BoardsComponent,
  },
  {
    path: 'board', component: BoardComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
