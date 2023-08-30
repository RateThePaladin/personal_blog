---
title: the great cd
author: Robert
pubDate: 2023-02-08
number: '33'
draft: false
tags:
- DevOps
- CI/CD
description: description
featured: true
heroImage: /images/33/hero.png
---
### réalisation
<iframe width="100%" height="300px" src="https://www.youtube.com/embed/npB_ZhkPo7I" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### raison d'être
Hey yall. This week's postable project is the CD portion of our pipeline and the continuation of my post last week. The end goal of this pipeline is twofold: primarily, I want to enable a seamless developer experience as we move into our new repo. This means automating all signatures, builds, deployments, and notarization that are required to distribute a macos app. Secondly, I want to set our app up with the Sparkle framework to handle automatic updating. 

### le processus
I left off last week with a functional CI pipeline that would listen for changes on a repo, check the code out on a mac mini, build the app, and upload it to CircleCI's artifact storage. This was a great first step, but it needed some serious updating to be useful as the integration steps of our CI/CD build. This brings me to Apple's notary service.

When distributing an app outside of the app store, Apple requires said app to be submitted to their notary API so they can check it for malicious code. After the app is submitted, it must meet certain criteria for it to be approved. The complete list of said criteria can be found [here](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution), and include settings such as enabling hardened runtime, signing the app with a developer id application certificate, and disabling the com.apple.security.get-task-allow entitlement.

When your app meets all of Apple's requirements, the app must be zipped and submitted to their notary API using the following command:

```
xcrun notarytool submit your_app.zip --keychain-profile "AC_PASSWORD" --wait --timeout 2h
```
If everything goes smoothly, you should see a dialog in the terminal stating that the app has been accepted and approved for distribution. Note: the .app file must be zipped using Apple's ditto command! If you use the zip command, the app will lose its internal aliases and the notary will reject it. Here's what using the ditto command looks like:
```
/usr/bin/ditto -c -k --keepParent dub.app dub_prenotary.zip
```

After getting back the accepted status from the notary, we're ready to staple the notarization to the .app file. This is really easy and can be done with one command:

```
xcrun stapler staple "dub.app"
```

After the stable operation succeeds, we need to put the app through a second round of notarization! Fun. To do that, we need to zip the app again using the same method as above. Then, submit the freshly zipped app to the notary api for a second time. If it's approved again, your app is ready for distribution!

Next, I want to talk about the pipeline as a whole. Here's what the entire circle ci config.yaml looks like:

```
version: 2.1
workflows:
  testing:
    jobs:
      - build
jobs:
  build:
    machine: true
    resource_class: dubdubdub-xyz/dubhub
    steps:
      - checkout
      - add_ssh_keys:
          fingerprints:
            - "5e:16:bb:b6:2b:e4:19:16:04:ad:34:f2:af:e7:23:c6"
      - run:
          name: Archive Application
          command: cd dub && xcodebuild -scheme dub archive -archivePath build/Release/archive/Archive.xcarchive -configuration Release OTHER_CODE_SIGN_FLAGS\=--timestamp CODE_SIGN_INJECT_BASE_ENTITLEMENTS=No
      - run:
          name: Export Archive to App
          command: cd dub && xcodebuild -exportArchive -archivePath build/Release/archive/Archive.xcarchive -exportOptionsPlist ../Supports/ExportOptions.plist -exportPath build/Release/app 
      - run:
          name: Compress app
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && /usr/bin/ditto -c -k --keepParent dub.app dub_prenotary.zip
      - run:
          name: Notarize App
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && xcrun notarytool submit dub_prenotary.zip --keychain-profile "AC_PASSWORD" --wait --timeout 2h
      - run:
          name: Staple Notarization
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && xcrun stapler staple "dub.app"
      - run:
          name: Zip App w/ Notarization
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && /usr/bin/ditto -c -k --keepParent dub.app dub.zip
      - run:
          name: Notarize Zip
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && xcrun notarytool submit dub.zip --keychain-profile "AC_PASSWORD" --wait --timeout 2h
      - run:
          name: Copy to Release Folder
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && mkdir Sparkle && cp dub.zip Sparkle
      - run:
          name: Download Sparkle Tools
          command: curl -L https://github.com/sparkle-project/Sparkle/releases/download/2.3.1/Sparkle-for-Swift-Package-Manager.zip -o  /var/opt/circleci/workdir/dub/SparkleForSwift.zip && unzip /var/opt/circleci/workdir/dub/SparkleForSwift.zip -d /var/opt/circleci/workdir/dub/SparkleForSwift
      - run:
          name: Generate Sparkle Keys
          command: cd /var/opt/circleci/workdir/dub/SparkleForSwift && ./bin/generate_keys
      - run:
          name: Generate Sparkle Appcast
          command: cd /var/opt/circleci/workdir/dub/SparkleForSwift && ./bin/generate_appcast /var/opt/circleci/workdir/dub/build/Release/app/Sparkle
      - run: # Deploy to S3 using the sync command
            name: Deploy to S3
            command: aws s3 sync /var/opt/circleci/workdir/dub/build/Release/app/Sparkle s3://circle-ci-dub-master

```

Note that the last five actions in the pipeline pertain to handling app updates through Sparkle. I'll go more in-depth into how this works in another post, but this is what enables the app to auto-update as shown in the video.


### fin
Ok friends, we have a completed pipeline! This should speed up our method of distribution significantly, as well as allow people to check for updates when launching the existing app instead of downloading every update as a separate app. Thanks for reading, and as always, have a great day.
