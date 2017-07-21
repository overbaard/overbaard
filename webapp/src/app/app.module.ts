import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {APP_BASE_HREF, HashLocationStrategy, LocationStrategy} from '@angular/common';
import {TestStoreComponent} from './components/playpen/test-store.component';
import {StoreModule} from '@ngrx/store';
import {AssigneesService} from './common/assignee/assignee.service';
import {reducer} from './app-store';

@NgModule({
  declarations: [
    AppComponent,
    TestStoreComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,
    ReactiveFormsModule,
    AppRoutingModule,
    StoreModule.provideStore(reducer)
  ],
  providers: [
    {provide: APP_BASE_HREF, useValue: '/'},
    {provide: LocationStrategy, useClass: HashLocationStrategy},
    AssigneesService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
