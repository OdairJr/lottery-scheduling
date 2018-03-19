import { NgModule } from '@angular/core';

import { Routes, RouterModule } from '@angular/router';

import { LayoutComponent } from '../components/layout/layout.component';
import { HomeComponent } from '../components/home/home.component';

const appRoutes: Routes = [
  {
    path: '', component: LayoutComponent, children: [
      { path: 'home', component: HomeComponent },
      { path: '', pathMatch: 'full', redirectTo: '/home' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
