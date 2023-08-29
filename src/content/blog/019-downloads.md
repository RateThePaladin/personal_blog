---
title: Downloads
author: Robert
pubDate: 2023-01-11
number: '19'
draft: false
tags:
- Feature
description: description
---
### réalisation
The code below, and dub v0.0.4

### raison d'être
Hey yall. This week's project is a core feature of the browser that we needed for the MVD, or minimum viable dub. It's...downloads! Not much more to say here, we need to be able to download things from the internet. Uploads also work similarly, which I will be takling soon.

### le processus
Our browser is built around a WKWebView. While you can use javascript to handle downloads in said webview, writing the code to handle the swift -> javascript -> swift trnasition is quite annoying. Bleh. Instead, we will be uning a new API that Apple recetly released called the WKDownloadDelegate. That way we can write everything in swift. Thanks Apple! They also have very helpful download status and completion handlers that we can use and integrate into the UI at a later date.

The logic for download handling is pretty simple. We need to: detect that a link is a download -> decide on the policy to handle the download -> hand off link to WKDownloadDelegate -> set save location with the NSSavePanel -> handle download completion. 

So, let's detect that a link should be downloaded rather than opened in a tab. This can be handled with two functions. The first uses the .shouldPerformDownload handler: 


![CleanShot 2023-01-11 at 16.33.01@2x.png](https://cms.experiments.gg/uploads/Clean_Shot_2023_01_11_at_16_33_01_2x_0cd50478fe.png)


This function will catch traditional download links, such as a .deb file. Your browser knows it can't open a .deb extension in a new tab, so it will trigger the .shouldPerformDownload. But what if something you want to download can be opened in a new tab, such as a .pdf file? That case is caught by our second function:


![CleanShot 2023-01-11 at 16.33.11@2x.png](https://cms.experiments.gg/uploads/Clean_Shot_2023_01_11_at_16_33_11_2x_f96e83c370.png)


This function uses the canShowMIMEType that helps your browser determine that a file should be downloaded rather than opened. You'll also notice that both functions use a decisionHandler(.download) to perform said download, so let's write that next.


![CleanShot 2023-01-11 at 16.33.49@2x.png](https://cms.experiments.gg/uploads/Clean_Shot_2023_01_11_at_16_33_49_2x_0e92082b7d.png)

Ok great. These two functions perform exactly the same action with the only difference being the 'navigationAction' vs the 'navigationResponse'. Next let's get the WKDownloadDelegate going and handle some downloads!


![CleanShot 2023-01-11 at 16.38.57@2x.png](https://cms.experiments.gg/uploads/Clean_Shot_2023_01_11_at_16_38_57_2x_771851062d.png)

This looks a (little) more big and scary, but all it's doing is creating a download function inside the WKDownloadDelegate that opens a save window with the dialog.options defined and passes the save path along to the completionHandler. Nice. This will open a fun little save box that looks like this:


![CleanShot 2023-01-11 at 13.47.47@2x.png](https://cms.experiments.gg/uploads/Clean_Shot_2023_01_11_at_13_47_47_2x_eb96a441f1.png)


### fin
Ok friends, we just handled some downloads! Nice, that was actually pretty easy. We can say thank you to Apple for building some functional APIs. As always, and til next time, have a great day.
