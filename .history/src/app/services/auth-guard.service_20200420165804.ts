import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { SolidAuthService } from './solid-auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    public authenticationService: SolidAuthService
  ) { }

  canActivate(): boolean {
    return this.authenticationService.isAuthenticated();
  }

}
