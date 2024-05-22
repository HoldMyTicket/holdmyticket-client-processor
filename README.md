# holdmyticket-client-processor

to setup dev server

```
gulp --type dev
```

## Publish
To publish a new version you first need to run Gulp in `publish` mode

```
gulp --type publish
```

Increment the `package.json` version.

Then use yarn to publish the package to the npmjs.com repository. You will be asked for a version number during publishing, if you already updated it then hit `[enter]`. Otherwise, if you forgot to increment the version number, then enter the new one here (don't forget to commit and push!). 

```
yarn publish
```

enter your account information for npmjs.com
