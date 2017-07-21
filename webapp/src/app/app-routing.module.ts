import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {TestStoreComponent} from './components/playpen/test-store.component';

const routes: Routes = [
  {
    path: 'play', component: TestStoreComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
