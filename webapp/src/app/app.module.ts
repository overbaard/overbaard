import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {APP_BASE_HREF, HashLocationStrategy, LocationStrategy} from '@angular/common';
import {TestStoreComponent} from './components/playpen/test-store.component';
import {StoreModule} from '@ngrx/store';
import {AssigneeService} from './common/assignee/assignee.service';
import {reducer} from './app-store';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import { environment } from '../environments/environment';


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
    StoreModule.provideStore(reducer),
    !environment.production ? StoreDevtoolsModule.instrumentOnlyWithExtension() : []
  ],
  providers: [
    {provide: APP_BASE_HREF, useValue: '/'},
    {provide: LocationStrategy, useClass: HashLocationStrategy},
    AssigneeService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
