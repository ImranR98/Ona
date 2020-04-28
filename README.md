# Gallery15
Simple, self hosted, single user, web based photo gallery.

Scan specific directories on your server for photos and videos and display them on a web page in a simple paginated interface. 

## Requirements
- Node.js
- MongoDB
- ffmpeg

### Configuration
An RSA public/private key pair is needed for user sessions, along with a duration, in seconds, that each session lasts. These are needed as environment variables and can be defined in a .env file in the root directory.

Example of a valid .env file (Note that variables must fit in one line, so the public/private keys have '\n' in place of line breaks. This is accounted for in app.js):
```
RSA_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\n...\n...\n-----END RSA PRIVATE KEY-----
RSA_PUBLIC_KEY=-----BEGIN RSA PUBLIC KEY-----\n...\n...\n-----END RSA PUBLIC KEY-----
EXPIRES_IN=86400
```

All other configuration variables are in variables.js.

## Deployment
Run ```node app.js```

## Authors
* **Imran Remtulla** - [ImranR98](https://github.com/ImranR98)