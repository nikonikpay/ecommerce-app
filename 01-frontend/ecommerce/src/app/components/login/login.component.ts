import {Component, Inject, OnInit} from '@angular/core';
import myAppConfig from "../../config/my-app-config";
import * as oktaSignin from '@okta/okta-signin-widget';
import OktaSignIn, {OktaSignInAPI} from "@okta/okta-signin-widget";
import { OktaAuth, Tokens } from '@okta/okta-auth-js'
import {OKTA_AUTH, OktaAuthStateService} from "@okta/okta-angular";


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  oktaSignin : any;

  constructor(private oktaAuthService: OktaAuthStateService, @Inject(OKTA_AUTH) private oktaAuth: OktaAuth) {

    this.oktaSignin =  new OktaSignIn({
      logo:'assets/images/logo.png',
      baseUrl:myAppConfig.oidc.issuer.split('/oauth2')[0],
      clientId: myAppConfig.oidc.clientId,
      redirectUri: myAppConfig.oidc.redirectUri,
      authParams:{
        pkce:true,
        issuer:myAppConfig.oidc.issuer,
        scopes:myAppConfig.oidc.scope
      }


    });


  }

  ngOnInit(): void {
    this.oktaSignin.remove();
    this.oktaSignin.renderEl({
      el:'#okta-sign-in-widget'
    },(response) =>{
      if (response.status === 'SUCCESS'){
        this.oktaAuth.signInWithRedirect();
      }
    },(error) =>{
      throw error;
      }
    );

  }
}
