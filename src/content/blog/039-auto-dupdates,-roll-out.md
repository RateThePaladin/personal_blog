---
title: Auto Dupdates, Roll Out
author: Robert
pubDate: 2023-02-15
number: '39'
draft: false
tags:
- Dupdate
description: description
---
### réalisation
download [dub](https://downloads.dubdubdub.xyz/dub.dmg)

### raison d'être
Hey yall. This week's postable project is the CI (and soon-to-be CD) pipeline for our new main repo. The goal is for any new code changes to automatically be pulled, built, archived, signed, notarized, and uploaded to an AWS S3 bucket. Full disclosure, the pipeline is not complete yet. I encountered many issues with xcode server, npm, and signatures in particular that ate up the majority of my time. Hopefully, the documentation steps here help someone avoid these issues in the future.

### le processus
This week I'm running out of time for writing this post, so I'm just going to dive right into the updated pipeline .yml. Lots has changed, and I'll explain some of the important bits below.


```

version: 2.1
workflows:
  release:
    jobs:
      - masterBuild:
          filters:
            branches:
              only: master
      - betaBuild:
          filters:
            branches:
              only: staging
jobs:
  betaBuild:
    machine: true
    resource_class: dubdubdub-xyz/dubhub
    steps:
      - add_ssh_keys:
          fingerprints:
            - "5e:16:bb:b6:2b:e4:19:16:04:ad:34:f2:af:e7:23:c6"
      - checkout
      - run:
          name: Archive Application
          command: cd dub && xcodebuild -scheme dub archive -archivePath build/Release/archive/StagingArchive.xcarchive -configuration Beta OTHER_CODE_SIGN_FLAGS\=--timestamp CODE_SIGN_INJECT_BASE_ENTITLEMENTS=No
          no_output_timeout: 20m
      - run:
          name: Export Archive to App
          command: cd dub && xcodebuild -exportArchive -archivePath build/Release/archive/StagingArchive.xcarchive -exportOptionsPlist ../Supports/ExportOptions.plist -exportPath build/Release/app
      - run:
          name: Compress app
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && /usr/bin/ditto -c -k --keepParent --sequesterRsrc dub_beta.app dub_beta_prenotary.zip
      - run:
          name: Notarize App
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && xcrun notarytool submit dub_beta_prenotary.zip --keychain-profile "AC_PASSWORD" --wait --timeout 2h
      - run:
          name: Staple Notarization
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && xcrun stapler staple "dub_beta.app"
      - run:
          name: Zip App w/ Notarization
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && /usr/bin/ditto -c -k --keepParent --sequesterRsrc dub_beta.app dub_beta.zip
      - run:
          name: Notarize Zip
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && xcrun notarytool submit dub_beta.zip --keychain-profile "AC_PASSWORD" --wait --timeout 2h
      - run:
          name: Copy Zip to Release Folder
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && mkdir SparkleStaging && cp dub_beta.zip SparkleStaging
      - run:
          name: Download Sparkle Tools
          command: curl -L https://github.com/sparkle-project/Sparkle/releases/download/2.3.1/Sparkle-for-Swift-Package-Manager.zip -o  /var/opt/circleci/workdir/dub/SparkleForSwift.zip && unzip /var/opt/circleci/workdir/dub/SparkleForSwift.zip -d /var/opt/circleci/workdir/dub/SparkleForSwift
      - run:
          name: Generate Sparkle Keys
          command: cd /var/opt/circleci/workdir/dub/SparkleForSwift && ./bin/generate_keys
      - run:
          name: Clone and Generate Appcast
          command: cd /var/opt/circleci/workdir/Supports && ./appcast-staging.sh
      - run:
          name: Create DMG
          command: npm install -g appdmg && cd /var/opt/circleci/workdir/dub/build/Release/app && appdmg /var/opt/circleci/workdir/Supports/appdmg_beta.json dub_beta.dmg
      - run:
          name: Notarize DMG
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && xcrun notarytool submit dub_beta.dmg --keychain-profile "AC_PASSWORD" --wait --timeout 2h
      - run:
          name: Staple DMG Notarization
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && xcrun stapler staple "dub_beta.dmg"
      - run:
          name: Copy DMG to Release Folder
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && cp dub_beta.dmg SparkleStaging
      - run: # Deploy to S3 using the sync command
            name: Deploy to S3
            command: aws s3 sync /var/opt/circleci/workdir/dub/build/Release/app/SparkleStaging s3://downloads.dubdubdub.xyz
            
            

```

A couple of cool things here. First, you'll notice the new actions to generate the .dmg of our application. This offers users a cool-looking installer pictured at the top of the post. It also maintains the .zip pipeline in parallel so that Sparkle can handle updates automatically. The DMG below was generated using this code.
![dmg](https://i.imgur.com/nttqDPJ.jpeg)

Additionally, we're using a new s3 bucket named downloads.dubdubdub.xyz. This new bucket will allow us to host all our images while connected to our domain. Cloudflare is also providing caching, proxying, and access controls for this domain, which will save us a whole bunch of bandwidth. This is especially important as Sparkle now automatically checks for updates and downloads them in the background. Rather than making AWS manage this traffic (expensive), Cloudflare can cache some of our data to serve out to clients. We also get the all-important DDOS protection that Cloudflare is famous for. 

Now we're on to the fun stuff! It's time that we created one version of the app that will auto-update when we push new versions weekly. That's right, you no longer have to return to the experiments site to get your weekly dose of dub! When you first launch the app, it will now ask if you would like to automatically check for updates. Looks like this:
![check for updates](https://i.imgur.com/rZAWfTI.png)

Clicking yes will automatically check for updates periodically by querying our appcast.xml file. This is basically just a list of all the versions of dub and their corresponding download URLs. For the curious, here's what that looks like as of 2/15/23:
![appcast](https://i.imgur.com/bPCAgL2.jpeg)

When a new version of our app is merged into the master branch, our ci/cd pipeline runs. This generates the new .zip and .dmg files and updates the appcast.xml with the new version of the app. Sparkle queries the appcast and downloads the new version of the app from the associated url. Very clean and efficient.

### fin
Ok friends, we did a lot of small things this week. As a whole, I'm very proud of our build pipeline and auto-updated to the app. There was also a ton of work on getting all the changes integrated and working together, and our repo is finally a great place for us to work. As always, and til next time, have a great day.
