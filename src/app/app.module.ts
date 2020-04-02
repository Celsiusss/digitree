import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { DigimonDetailComponent } from './digimon-detail/digimon-detail.component';
import { HomeComponent } from './home/home.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {SELECT_PANEL_MAX_HEIGHT} from '@angular/material/select';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'digimon/:name', component: DigimonDetailComponent },
  { path: '**', redirectTo: '/' }
];

@NgModule({
  declarations: [AppComponent, DigimonDetailComponent, HomeComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot(routes),
    BrowserAnimationsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatFormFieldModule,
    MatInputModule
  ],
  providers: [
    {
      provide: SELECT_PANEL_MAX_HEIGHT,
      useValue: 512
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
