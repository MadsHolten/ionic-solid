import { Component } from '@angular/core';

import { Platform } from '@ionic/angular';
import { SplashScreen } from '@ionic-native/splash-screen/ngx';
import { StatusBar } from '@ionic-native/status-bar/ngx';
import { Router } from '@angular/router';

import { SolidAuthService } from './services/solid-auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss']
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private router: Router,
    private splashScreen: SplashScreen,
    private statusBar: StatusBar,
    private authenticationService: SolidAuthService
  ) {
    this.initializeApp();
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.statusBar.styleDefault();
      this.splashScreen.hide();

      // Check auth status
      this.authenticationService.authState.subscribe(state => {
        if (state) {
          console.log("Logged in");
          // Navigate to map tab if logged in
          this.router.navigate(['home']);
        } else {
          console.log("Not logged in");
          // Navigate to login page if not logged in
          // this.router.navigate(['login']);
        }
      });
    });
  }
}
