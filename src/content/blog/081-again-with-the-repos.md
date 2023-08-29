---
title: again with the repos
author: Robert
pubDate: 2023-05-03
number: '81'
draft: false
tags:
- Exploration
description: exploring
notes:
- to add an image, add it to public/images, then use "![<alt-text-here](../../../public/images/image-name-here>.png)"
- to like to another experiment, use: "[<text-here>](<file-name-here>)"
- go to read view to see approximately what spacing will look like on the actual site
- learn markdown and don't cry about it
---

### réalisation
Our new repo!

### raison d’être
Hey y'all. This week’s post-able project is  the new repo for the persistent version of dub! Unfortunately, we needed a whole new repo because the addition of data persistence required the whole app to be fundamentally restructured. Instead of dealing with the insane amount of merge conflicts and Xcode project settings, we just decided to start from scratch. This was a bit depressing as a lot of work went into the original repo and the ci/cd pipelines it contained, but it was also a chance to make some changes that got buried in the task list. 

### le processus
I'm going to skip most of the boring project setup stuff, especially what I've already talked about in previous posts. Instead, I'm going to discuss a fun new (and small) quality of life feature that I finally had the time to implement. Ok so here's the problem: what if we want to do a one off build of a branch without merging it into staging or master, where our two release pipelines live? A developer could check out a branch directly and run the app on their machine, but we often find ourselves needing an easily distributable copy that we can send around internally or show off in product demos. So let's build a pipeline that we can trigger to manually build, export, notarize, and staple together an app for a specified branch!

##### tags to the moon
The core of this plan will use tags. Github tags allow you to quickly and easily add a branch agnostic marker  to a commit, which CircleCI can then read as a trigger to start a build pipeline. Knowing that we're going to be using tags, let's write a new job into our CircleCI config file:
```
version: 2.1
workflows:
  release:
    jobs:
      - testingBuild:
          filters:
            tags:
              only: /^deploy-\w+/
            branches:
              ignore: /.*/
jobs:
  testingBuild:
    machine: true
    resource_class: dubdubdub-xyz/dubhub
    steps:
      - checkout
      - run:
          name: Archive Application
          command: cd dub && xcodebuild -scheme dub archive -archivePath build/Release/archive/Archive.xcarchive -configuration Release OTHER_CODE_SIGN_FLAGS\=--timestamp CODE_SIGN_INJECT_BASE_ENTITLEMENTS=No
          no_output_timeout: 20m
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
          name: Copy Zip to Release Folder
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && mkdir "<< pipeline.git.tag >>" && cp dub.zip "<< pipeline.git.tag >>"
      - run:
          name: Create DMG
          command: npm install -g appdmg && cd /var/opt/circleci/workdir/dub/build/Release/app && appdmg /var/opt/circleci/workdir/Supports/appdmg.json dub.dmg
      - run:
          name: Notarize DMG
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && xcrun notarytool submit dub.dmg --keychain-profile "AC_PASSWORD" --wait --timeout 2h
      - run:
          name: Staple DMG Notarization
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && xcrun stapler staple "dub.dmg"
      - run:
          name: Copy DMG to Release Folder
          command: cd /var/opt/circleci/workdir/dub/build/Release/app && cp dub.dmg "<< pipeline.git.tag >>"
```
Most of this is the standard Xcode build stuff I've mentioned before, but there are two really cool new things I'm doing here. One is the new 'filters' section on the job config entry. This is telling CircleCI to only run when the tag matches the regex filter ''/^deploy-\w+/",  which basically just looks for the phrase 'deploy-' followed by any number of characters. The second really cool thing is the "<< pipeline.git.tag >>" you'll noticed scattered throughout the config. This is a CircleCI specific config that accesses a pipeline value that the build has access to. In this case, we're using it to dynamically set the output path of the build so that it matches the tag of the build. This way we can keep track of all the builds.

##### git-ing tags
So now that we have the pipeline setup to build from specific tags, how to we go about adding said tags to a specific commit when we want to run the pipeline? If you're fine doing it manually you can actually do so from within the Github desktop app. Just go to the repo, click on the activity view, right click on the commit and click add tag. That'll look like this:
![github](/images/robert/81/Github_Tag.png)

If the tag you create matches the regex we specified in the pipeline, the build will start. But what are the values after the deploy- value, I hear you ask. Well one thing about Github tags that I haven't mentioned yet is that they all need to be unique. That's a bit of a bummer if you're doing it manually because it means keeping track of a whole bunch of random info, and it's difficult to correlate a tag with a commit when looking back. Instead, let's use a handy already computer value called the 'short git version hash'. This is a short, cute, and unique little string that gets computed automatically on every commit. These elements make it the perfect thing to use as our tag. 

We now have our always unique naming convention! Just tag a commit with "deploy-'your_branch_hash'" and away we go.

##### auto-magically
This is cool and all, but adding these tags manually is a bit of a pain. Let's turn this into a one click solution! For that we're going to write a github action with a manual trigger. That way we can run it whenever we want and on whatever branch we want. 

Ok let's start writing. This action needs to do a couple of things. It should:
1. Check out our code
2. Authenticate to the repo
3. Compute the short branch hash
4. Create a tag using said short branch hash
5. Catch any errors

Not too bad. I'm going to skip right to the solution and just throw my yaml into the world:
```
name: tagDeploy

on:
  workflow_dispatch:
jobs:
  get-short-branch-identifier:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Authenticate
        run: |
          git config user.name "GitHub Actions Bot"
          git config user.email "<>"

      - name: Get short branch identifier
        id: get-short-branch-id
        run: |
          echo "SHORT_BRANCH_ID=$(git rev-parse --short HEAD)" >> $GITHUB_ENV
        # env:
        #   SHORT_BRANCH_ID: $(cat short-branch-id.txt)

      - name: Use short branch identifier
        run: |
          echo "${{ env.SHORT_BRANCH_ID }}"

      - name: Create Tag
        uses: rickstaa/action-create-tag@v1
        id: "tag_create"
        with:
          tag: "deploy-${{ env.SHORT_BRANCH_ID }}"
          tag_exists_error: false

      - run: |
          echo "Tag already present: ${{ env.TAG_EXISTS }}"

      - run: |
          echo "Tag already present: ${{ steps.tag_create.outputs.tag_exists }}"
```

Nothing too complex here. I'm using the action-create-tag step to do the actual tagging. You can find some more info on the project [here](https://github.com/rickstaa/action-create-tag). Only other line that really needs explaining is this one:
```
echo "SHORT_BRANCH_ID=$(git rev-parse --short HEAD)" >> $GITHUB_ENV
```
Here we're using Github's environment variables, setting the output of the 'git rev-parse --short HEAD' command to the $SHORT_BRANCH_ID variable. We can then access the value later in the action by using 'env.SHORT_BRANCH_ID'. Please note that env variables can only be used within the current job, so make sure to take that into consideration when writing your action.

### fin
Ok friends, I hope you enjoyed some fun new ci/cd features that I spun up this week. With the new repo prepped and ready to go, our next major launch of dub should go pretty smoothly. As always, and til next time, have a great day.