import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { AuthService } from './services/auth.service'
import { AuthComponent } from './auth/auth.component'
import { ChoiceComponent } from './choice/choice.component'
import { GalleryComponent } from './gallery/gallery.component'
import { ConfigComponent } from './config/config.component'
import { SingleItemComponent } from './single-item/single-item.component'


const routes: Routes = [
  {
    path: '',
    redirectTo: '/choice',
    pathMatch: 'full'
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
    path: 'config',
    component: ConfigComponent,
    canActivate: [AuthService]
  },
  {
    path: 'gallery/:collection',
    component: GalleryComponent,
    canActivate: [AuthService]
  },
  {
    path: 'gallery/:collection/:item',
    component: SingleItemComponent,
    canActivate: [AuthService]
  },
  {
    path: '**',
    redirectTo: '/'
  }
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
