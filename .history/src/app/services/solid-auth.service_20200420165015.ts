import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, Platform } from '@ionic/angular';
import { BehaviorSubject } from 'rxjs';
import solidAuth from 'solid-auth-client';
import { fetchDocument } from 'tripledoc';
// import { foaf, vcard } from 'rdf-namespaces';

// Tell the TypeScript compiler that somewhere globally there is an object called tripledoc
// declare const tripledoc: any;

@Injectable({
  providedIn: 'root'
})
export class SolidAuthService {

  authState = new BehaviorSubject(false);

  constructor(
    private router: Router,
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
      // const webIdDoc = await fetchDocument(webId);
      // console.log(tripledoc.fetchDocument(webId))
      console.log(fetchDocument(webId));

      // /* 2. Read the Subject representing the current user's profile: */
      // const profile = webIdDoc.getSubject(webId);
      
      // /* 3. Get user name and profile image */
      // const userName = profile.getString(foaf.name);
      // const profileImage = profile.getRef(vcard.hasPhoto);

      /* 4. Save to local storage so user info can be retrieved from here */
      // await this.storage.set('USER_INFO', {webId, userName, profileImage});

      await this.storage.set('USER_INFO', {webId});

    }

    else{
      console.log("No webId in session");
    }
  }

  async getUserInfo(){
    return this.storage.get('USER_INFO');
  }

}
