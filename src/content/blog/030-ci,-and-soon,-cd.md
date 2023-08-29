---
title: CI, and soon, CD
author: Robert
pubDate: 2023-02-01
number: '30'
draft: false
tags:
- Dupdate
description: description
---
### réalisation
<iframe width="560" height="315" src="https://www.youtube.com/embed/guLOqdolHWY" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### raison d'être
Hey yall. This week's postable project is the CI (and soon to be CD) pipeline for our new main repo. The goal is for any new code changes to automatically be pulled, built, archived, signed, notarized, and uploaded to an AWS S3 bucket. Full disclosure, the pipeline is not complete yet. I encountered many issues with xcode server, npm, and signatures in particular that ate up the majority of my time. Hopefully, the documentation steps here help someone avoid these issues in the future.

### le processus
The beating heart of our pipeline is a dedicated mac mini. Like Harry Potter, it lives in the cupboard under the stairs of our apartment and is entirely dedicated to staying out of sight. Despite this discrete nature, it provides an essential service by acting as our xcode build server and GitHub actions runner. 

The process began with wasting a day with Apple's built-in xcode server functionality. After creating a dedicated user account and following all the setup processes for creating a bot, I encountered what would prove to be a fatal flaw. For seemingly no reason, xcode bots are unable to run any npm commands. This is despite installing npm five separate ways, creating symbolic links to the package directory, using nvm to reinstall node at runtime (nvm also not found), changing xcode's shell, and many other troubleshooting steps. After wasting a day troubleshooting, I decided to pivot to CircleCI.

CircleCI, as the name suggests, is a CI/CD platform that integrates with GitHub as a runner. Importantly, it also supports running bare metal (aka on our mac mini). This means no subscription cost. If you don't have a mac mini or another dedicated build machine handy, CircleCI does have macos cloud-based runners with xcode tools pre-installed. Be warned that you will quickly exceed the free tier's utilization limits. 

Configuring CircleCI on the mac mini was a bit of a headache, but most of the important steps can be found in their documentation [here](https://circleci.com/docs/runner-installation-mac/). If you're like me and running this on a M1 device, you'll probably have to use the following workaround to get the machine runner started:

```
sudo chmod +x /opt/circleci/circleci-launch-agent
sudo /opt/circleci/circleci-launch-agent --config=/Library/Preferences/com.circleci.runner/launch-agent-config.yaml
```

This should kickstart the runner and give you an output that looks like this:

![](https://i.imgur.com/B25nK8m.jpg)

Sweet, we got our runner working! Good job yall. Now it's time to configure CircleCI. Like most runners, this is done in a YAML file and smacked into the repo. GitHub will use said yaml as a config file for the runner, and it will run on every push to a specified branch or set of branches. This is helpful if you need to run a different pipeline for different versions of the app. Here's my config.yaml:


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
      - run:
          name: Build Application
          command: cd dub && xcodebuild -configuration Release
      - run:
          name: Compress app
          command: cd /var/opt/circleci/workdir/dub/build/Release && zip -r dub.zip dub.app
      - store_artifacts:
          path: /var/opt/circleci/workdir/dub/build/Release/dub.zip
          destination: dub
    

```

NOTE! The above code does not include notarization! Xcode will happily sign and spit out a .app file, but any user who tries to open the app will be greeted with the following scary warning:

![](https://i.imgur.com/U0Wqhxj.jpg)


We certainly don't want this warning on a production app. This won't be a problem if you're realeasing an app directly to the app store, as Apple handles notarization in that case. However, as we are distributing the app outside of Apple's clutches (shocking), we need to do some extra steps. [Here](https://developer.apple.com/documentation/notaryapi) is a link to Apple documentation on their notary API. Our app will need two rounds of notarization with a staple in the middle. Which is currently broken with CircleCI. Sigh. 

### prochaines étapes
Today I am introducing a new section: next steps. My job here is not done. After figuring out and implementing notarization, I need to set up a new S3 bucket for hosting our images, init proper branching in GitHub, setup the pipelines for the new branches, and set up Sparkle for app updating. More on this to come in the next post, and hopefully, a version of the browser that you can update for years to come. No more installing separate apps.


### fin
Ok friends, we finished the CI part of the CI/CD pipeline. There's still a significant amount of work to be done before the pipeline is production ready, including dealing with Apple's signature and notarization bs. But progress is progress, and lots has been learned. As always, and til next time, have a great day.
