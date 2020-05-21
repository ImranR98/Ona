# Ona
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
Run `npm i` - this is only required once to install dependencies.

Run ```npm start``` to run the application.

## Authors
* **Imran Remtulla** - [ImranR98](https://github.com/ImranR98)

## Screenshots
### Folders
![Screenshot of Folders page](/screenshots/folders.png?raw=true "Folders")
### Gallery
![Screenshot of Gallery page](/screenshots/gallery.png?raw=true "Gallery")
### Item View
![Screenshot of Item View](/screenshots/item.png?raw=true "Item View")
### Configuration
![Screenshot of Configuration page](/screenshots/config.png?raw=true "Configuration")
### Responsive UI and dark mode
![Screenshot showing Responsive UI and dark mode](/screenshots/responsiveDark.png?raw=true "Responsive UI and dark mode")