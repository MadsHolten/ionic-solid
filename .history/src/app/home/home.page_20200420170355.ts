import { Component } from '@angular/core';

import { SolidAuthService } from '../services/solid-auth.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  constructor(
    private authenticationService: SolidAuthService
  ) {}

  logout(){
    this.authenticationService.logout();
  }

}
