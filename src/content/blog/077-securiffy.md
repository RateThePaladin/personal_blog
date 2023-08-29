---
title: securiffy
author: Robert
pubDate: 2023-04-26
number: '77'
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
This post!

### raison d’être
Hey y'all. This week’s post-able project is a bit different than normal. Today I'm going to be discussing some best practices for securing secrets, such as API keys, in an iOS or MacOS project. I wanted to go through this to document some of my own learnings, as storing secrets in a client side application is one of the original problems of software development. I'll be documenting a couple different methods as well as my own testing, as some of the top articles on this topic are either outdated or just factually incorrect. 

### le processus
Alright, let's dive right into it. My goals for this project are the ability to store secrets securely without impacting the ability to reference them from code. This is especially important for something like an API key as it serves as a proof of identity for the client. 

Our goal here is to prove that the client is an instance of dub and that our server is actually our server and not someone 'man in the middle'ing us. To do that, we're going to use a combination of techniques and methods. 

##### certificate pinning
Certificate pinning, or SSL pinning, is a way of associating a given host with it's certificate or public key. Basically, it's our way of telling swift that every time we're talking to a given host, that host should have a specified certificate. So why is this helpful? Well we can use it to solve our server validation problem. Even if someone steps between an instance of our browser and our server and attempts to serve back bad data, the app will drop the connection because it won't have the associated certificate. 
![database](/images/robert/77/diagram.png)

One of the best open source packages for handling certificate pinning in swift is TrustKit. It's actually more of an open source framework than a package, but it allows you to do everything from simple SSL pinning policies to ''Auto-pinning functionality by swizzling the App's _NSURLConnection_ and _NSURLSession_ delegates in order to automatically add pinning validation to the App's HTTPS connections" - Github repo. Check out their repo by clicking on the embed below:
[![meme](/images/robert/77/github_embed.png)](https://github.com/datatheorem/TrustKit)

By implementing TrustKit in our project, we can be darn near sure that the server we're talking to is actually our server. Please note however that if your certificate was to expire or be renewed, your application would no longer accept any data from your server. This is especially bad because it would require you to release a new version of the app to fix, effectively bricking all old versions. 

***Be sure to have a proper plan in place when implementing certificate pinning to avoid extensive down time***.

Read more about the risks and setup process in [apple's blog](https://developer.apple.com/news/?id=g9ejcf8y).

##### just don't
So now that we know our server is valid, how do we authenticate that the client making the request is dub browser and not someone in Postman? This is normally where an API key would come in to play, but how do you store an API key securely in a client application? The short answer is: *just don't.* 

Any secret var stored in the app can be revealed by a motivated attacker. When your app is decompiled a poorly obfuscated secret can be revealed by just running the strings command in MacOS. Even after properly scrambling the data with a salt it can still be recovered with enough effort. So what if we just didn't store any secrets in the client?

Well, what's the alternative? Instead of making all of the API calls to the various services that your app relied on from within the application itself, let's just create a master API that acts as a proxy to all of your other APIs. Something like this:
![database](/images/robert/77/proxy.png)
***Please note these are only examples***

With this method we can keep all of our secrets on the server rather than on the client, remove the 'decompile and check' attack vector. 


### fin
Ok friends, I hope you enjoyed reading about some good to remember security practices when building a client app. A good rule of thumb is that anything in the app is public knowledge, and all sensitive data should be on your own secure server somewhere in the cloud. As always, and til next time, have a great day.