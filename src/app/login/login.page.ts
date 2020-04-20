import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { SolidAuthService } from '../services/solid-auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {

  public session;
  public webId;

  constructor(
    private authService: SolidAuthService,
    public navCtrl: NavController,
    public router: Router
  ) { }

  ngOnInit() {
    this.authService.getCurrentSession();
    console.log("login init")
  }

  // Log the user in using the provider specified
  async login(idp){

    try{
      await this.authService.login(idp);
    }catch(e){
      console.log(e);
    }

  }

}
