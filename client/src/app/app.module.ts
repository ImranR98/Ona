import { BrowserModule } from '@angular/platform-browser'
import { NgModule, Injector } from '@angular/core'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { FlexLayoutModule } from '@angular/flex-layout'
import { AuthComponent } from './auth/auth.component'
import { ChoiceComponent } from './choice/choice.component'
import { GalleryComponent } from './gallery/gallery.component'
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http'
import { AuthInterceptor } from './HttpInterceptor'
import { Eror404Component } from './eror404/eror404.component'
import { MatCardModule } from '@angular/material/card'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatFormFieldModule } from '@angular/material/form-field'
import { ReactiveFormsModule } from '@angular/forms'
import { MatGridListModule } from '@angular/material/grid-list'
import { MatTooltipModule } from '@angular/material/tooltip'
import { MatToolbarModule } from '@angular/material/toolbar'
import { MatSelectModule } from '@angular/material/select'
import { HeaderComponent } from './header/header.component'
import { ConfigComponent } from './config/config.component'
import { SingleItemComponent } from './single-item/single-item.component'

@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    ChoiceComponent,
    GalleryComponent,
    Eror404Component,
    HeaderComponent,
    ConfigComponent,
    SingleItemComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FlexLayoutModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatFormFieldModule,
    MatGridListModule,
    MatTooltipModule,
    MatToolbarModule,
    MatSelectModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
      deps: [Injector]
    }],
  bootstrap: [AppComponent]
})
export class AppModule { }
