// This file intercepts HTTP requests from the application

import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Injector } from '@angular/core';
import { AuthService } from './services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private injector: Injector) { }

    private authService: AuthService;

    intercept(req: HttpRequest<any>,
        next: HttpHandler): Observable<HttpEvent<any>> {
        const jwtToken = localStorage.getItem("jwt_token");
        this.authService = this.injector.get(this.authService);

        if (jwtToken) {
            this.authService.ifLoggedIn(true);
        }        

        if (this.authService.ifLoggedIn(false)) {
            const cloned = req.clone({
                headers: req.headers.set("Authorization",
                    "Bearer " + jwtToken)
            });
            return next.handle(cloned);
        }
        return next.handle(req);
    }
}