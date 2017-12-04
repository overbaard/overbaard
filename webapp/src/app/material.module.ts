import {
  MatButtonModule, MatCheckboxModule, MatProgressSpinner, MatProgressSpinnerModule, MatToolbar,
  MatToolbarModule
} from '@angular/material';
import {NgModule} from '@angular/core';


@NgModule({
  imports: [MatToolbarModule, MatProgressSpinnerModule, MatButtonModule, MatCheckboxModule],
  exports: [MatToolbarModule, MatProgressSpinnerModule, MatButtonModule, MatCheckboxModule],
})
export class MaterialModule {
}
