import { BrowserModule } from '@angular/platform-browser';
import { NgModule, Injector } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AuthComponent } from './auth/auth.component';
import { ChoiceComponent } from './choice/choice.component';
import { GalleryComponent } from './gallery/gallery.component';
import { AuthService } from './services/auth.service';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './HttpInterceptor';
import { Eror404Component } from './eror404/eror404.component';

@NgModule({
  declarations: [
    AppComponent,
    AuthComponent,
    ChoiceComponent,
    GalleryComponent,
    Eror404Component
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule
  ],
  providers: [{ provide: AuthService, useClass: AuthService },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
      deps: [Injector]
    }],
  bootstrap: [AppComponent]
})
export class AppModule { }
