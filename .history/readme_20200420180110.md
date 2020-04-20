# Ionic-Solid

This is a demonstration of how to build a multi-platform smartfone app with a [Solid](https://solid.inrupt.com/) backend.

### Run app
Run command `ionic lab` for side by side demo of Android/iOS
Run command `ìonic serve` for regular test environment.

## Build Android
* Run command `ionic cordova build android --prod` to build the app
* The apk is located in `platforms\android\app\build\outputs\apk\debug\app-debug.apk`

### Run on device
* Connect device with USB cable and make sure that USB debugging is enabled
* Build the app (see above)
* Run `adb devices` and confirm that the devce is listed
* Run `cordova run android` and the app should display on the screen
* Clean directory with `cordova clean`

### How to reproduce

#### 1. Initialising empty app and installing dependencies
- Start a new app with the Ionic CLI
`ionic start my-app blank`

- Install dependencies
`npm install --save solid-auth-client tripledoc rdf-namespaces @ionic/storage buffer process`

- Add the following to `src/polyfills.ts`:
    ```typescript
    import {Buffer} from 'buffer';
    (window as any).Buffer = Buffer;

    import * as process from 'process';
    (window as any).process = process;

    (window as any).setImmediate = window.setTimeout;
    ```
- Add the following to `src/index.html`:
    ```html
    <script>
        var global = global || window;
    </script>
    ```

#### 2. Building an Auth Guard
Add file `src/app/services/auth-guard.service.ts` with the following content:
```typescript
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
```

The `canActivate()` method depends on an autheinticationService which we will build in a new file `src/app/services/solid-auth.service.ts`
```typescript
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Storage } from '@ionic/storage';
import { ToastController, Platform } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import solidAuth from 'solid-auth-client';
import { fetchDocument } from 'tripledoc';
import { foaf, vcard } from 'rdf-namespaces';

@Injectable({
  providedIn: 'root'
})
export class SolidAuthService {

  authState = new BehaviorSubject(false);

  constructor(
    private router: Router,
    private storage: Storage,
    private platform: Platform,
    public toastController: ToastController
  ) {
    this.platform.ready().then(() => {
      this.ifLoggedIn();
    });
  }

  async ifLoggedIn() {
    let session = await this.getCurrentSession();
    if (session){
      this.authState.next(true);
    }else{
      // Send to login page if not logged in
      this.router.navigate(['login']);
    }
  }

  // Log in using Solid ID provider
  async login(identityProvider) {
    // This takes the user to the ID provider. Afterwards, the user returns and the "ifLoggedIn" will be executed and set the state
    await solidAuth.login(identityProvider);
  }

  async logout() {
    console.log("Log out")

    // Log out from Solid ID provider
    await solidAuth.logout();

    // Remove stored session
    await this.storage.remove('USER_INFO');

    // Navigate to login page and set auth state to false
    this.router.navigate(['login']);
    this.authState.next(false);

  }

  // Called by auth guard to check if user is logged in
  isAuthenticated() {
    return this.authState.value;
  }

  async getCurrentSession(){
    let session = await solidAuth.currentSession();
    if(session){

      // Save user info if nothing exist in localstorage
      await this.saveUserInfo(session);

      // this.router.navigate(['map']);
      this.authState.next(true);

      return session;
    }else{
      // Remove user info
      await this.storage.remove('USER_INFO');
      return false;
    }
  }

  async saveUserInfo(session){

    // return if user info already exists in local storage
    if(await this.getUserInfo()) return;

    if(session.webId){

      const webId = session.webId;

      /* 1. Fetch the Document at `webId`: */
      const webIdDoc = await fetchDocument(webId);

      // /* 2. Read the Subject representing the current user's profile: */
      const profile = webIdDoc.getSubject(webId);
      
      // /* 3. Get user name and profile image */
      const userName = profile.getString(foaf.name);
      const profileImage = profile.getRef(vcard.hasPhoto);

      const userInfo = {webId, userName, profileImage};
      console.log(userInfo);

      /* 4. Save to local storage so user info can be retrieved from here */
      await this.storage.set('USER_INFO', userInfo);

    }

    else{
      console.log("No webId in session");
    }
  }

  async getUserInfo(){
    return this.storage.get('USER_INFO');
  }

}
```

On platform ready, the `ifLoggedIn()` method is called. This method checks if there is an existing session, and if so, the authSession BehaviorSubject is set to true. If not, the user is forwarded to the login page which we will generate in a bit.

The `getCurrentSession()` method uses the solid-auth-client to get the current session if one exists. If so, more data about the user is saved to local storage and if not, the BehaviorSubject is set to false.

The `isAuthenticated()` method is the one used by the auth guard. It simply returns the current state of the authSession BehaviorSubject.

The `logout()` method ends the session with the ID provider, cleans the locally stored user data, sets the authSession BehaviorSubject to false and takes the user to the login page.

Next step is to add he auth guard to the secured pages. In `src/app/app-routing.module.ts`, the auth guard is appended in the following way:

```typescript
import { AuthGuard } from './services/auth-guard.service';
(...)
{ 
    path: 'home',
    canActivate: [AuthGuard],
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule)
}
```

In `src/app/app.component.ts`, the following is added to the initializeApp() method:

```typescript
this.authenticationService.authState.subscribe(state => {
    if (state) {
        console.log("Logged in");
        // Navigate to map tab if logged in
        this.router.navigate(['home']);
    } else {
        console.log("Not logged in");
    }
});
```

This is a subscription to the authState BehaviorSubject. If logged in, the user is taken to the home page. If not, the auth guard will forward to the login page.

**NB!** Some of this can probably be cleaned up a bit.

Setting up a login page is not described yet.