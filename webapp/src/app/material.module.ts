import {
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatDialogModule,
  MatExpansionModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatProgressSpinnerModule,
  MatSelectModule,
  MatSidenavModule, MatSliderModule,
  MatToolbarModule,
  MatTooltipModule
} from '@angular/material';
import {NgModule, Type} from '@angular/core';

// An attempt to avoid duplicating this in the imports and exports lists
const materialModules: Array<Type<any>> = [
  MatButtonModule,
  MatCardModule,
  MatCheckboxModule,
  MatDialogModule,
  MatExpansionModule,
  MatFormFieldModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
  MatMenuModule,
  MatProgressSpinnerModule,
  MatSidenavModule,
  MatSelectModule,
  MatSliderModule,
  MatToolbarModule,
  MatTooltipModule]

@NgModule({
  imports: materialModules,
  exports: materialModules,
})
export class MaterialModule {
}
