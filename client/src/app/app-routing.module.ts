import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { AuthService } from './services/auth.service'
import { AuthComponent } from './auth/auth.component'
import { ChoiceComponent } from './choice/choice.component'
import { GalleryComponent } from './gallery/gallery.component'
import { Eror404Component } from './eror404/eror404.component'


const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth',
    pathMatch: 'full'
  },
  {
    path: '404',
    component: Eror404Component,
  },
  {
    path: 'auth',
    component: AuthComponent
  },
  {
    path: 'choice',
    component: ChoiceComponent,
    canActivate: [AuthService]
  },
  {
    path: 'gallery/:collection',
    component: GalleryComponent,
    canActivate: [AuthService]
  },
  {
    path: '**',
    redirectTo: '/404'
  }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
