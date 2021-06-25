import { UserPool, VerificationEmailStyle, AccountRecovery} from '@aws-cdk/aws-cognito'
import { OAuthScope, UserPoolClientIdentityProvider } from '@aws-cdk/aws-cognito';
import { Construct, Duration, Stack } from '@aws-cdk/core';
import { APP_PREFIX } from '../constants';

export class CognitoStack extends Stack {
  userPool: UserPool

  constructor(scope: Construct, id: string) {
    super(scope, id)
    this.userPool = this.createUserPool()
  }

  createUserPool(): UserPool {
    const userPool = new UserPool(this, `${APP_PREFIX}-UserPool`, {
      selfSignUpEnabled: true,
      userVerification: {
        emailSubject: 'Verify your email for draft-app!',
        emailBody: 'Thanks for signing up for draft-app! Your verification code is {####}',
        emailStyle: VerificationEmailStyle.CODE,
      },
      signInCaseSensitive: false,
      signInAliases: {
        username: true,
        email: true
      },
      standardAttributes: {
        givenName: {
          required: true,
          mutable: true
        },
        email: {
          required: true,
          mutable: false
        }
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      passwordPolicy: {
        minLength: 6,
        requireDigits: false,
        requireLowercase: false,
        requireSymbols: false,
        requireUppercase: false,
      },

    })

    userPool.addDomain(`${APP_PREFIX}-Domain`, {
      // TODO: use a custom domain once we have that set up
      cognitoDomain: {
        domainPrefix: 'draft-app-dev'
      }
    })

    const appClient = userPool.addClient(`${APP_PREFIX}-RestApi`, {
      refreshTokenValidity: Duration.days(3650),
      accessTokenValidity: Duration.days(1),
      idTokenValidity: Duration.days(1),
      authFlows: {
        userPassword: true,
        adminUserPassword: true
      },
      supportedIdentityProviders: [
        UserPoolClientIdentityProvider.COGNITO
      ],
      oAuth: {
        callbackUrls: ['https://example.com/callback'],
        logoutUrls: ['https://example.com/logout'],
        scopes: [
          OAuthScope.COGNITO_ADMIN,
          OAuthScope.EMAIL,
          OAuthScope.OPENID,
          OAuthScope.PHONE,
          OAuthScope.PROFILE, 
        ],
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true
        },
      },

    })

    return userPool
  }
}