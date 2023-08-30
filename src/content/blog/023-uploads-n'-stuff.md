---
title: uploads n' stuff
author: Robert
pubDate: 2023-01-18
number: '23'
draft: false
tags:
- Xcode
description: description
heroImage: /images/23/hero.png
---
### réalisation
The code below, and Dub v0.05

### raison d'être
Hey yall. This week's project is another core feature of the browser that we needed for the MVD, or Minimum Viable Dub. It's...uploads! As we know from HTML development, image uploads can be specified with the \<input type="file"> syntax. Here's what that looks like: 
<input type="file"><br>
But how does your browser parse the html to detect when an image form is being called, and thus know to prompt an upload dialog? That's what I'll be explaining here.

### le processus
Our browser is built around a WKWebView, and thus we can use Apple's built-in upload panel called 'NSOpenPanel'. This panel is very easy to use and customize once you detect that an upload request has been triggered. The tricky part is listening for that prompt. As with downloads and the WKDownloadDelegate, uploads use the WKUIDelegate.

The logic for upload handling is pretty simple. We need to: set up our WKUIDelegate -> check if the version is OSX 10.12 or above -> listen for the frame to initiate the upload -> open the NSOpenPanel with the given paraments -> pass the URL of the file to be uploaded back with the completion handler. 

Let's get started with the WKUIDelegate. In our project, we use said delegate for more than just uploads. It was originally created to handle the window navigation actions, but it'll be a great starting point for our upload handling. Here's what our class looks like:

``` swift
class TabUIDelegate: NSObject, WKUIDelegate {

```

Nice and simple. The next step is to double-check that the user is running macOS 10.12 or above, as the functionality is not available in older versions of macOS. Our app currently only supports macOS 13.0 or above, but this will be a helpful check when we expand compatibility. 

``` swift
@available(OSX 10.12, *)

```

Now that we're double sure the user is running a new enough OS, we need to listen for the frame to initiate the upload -> open the NSOpenPanel with the given paraments. We can wrap both of these steps into a webView function similar to what we did for downloads.

``` swift
public func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {

```


At this point, I would recommend putting in some breakpoints and playing around with when it triggers. A great way to test this functionality is [with https://arie.ls/filetest/](https://arie.ls/filetest/). This site checks for upload capabilities and will trigger our breakpoints when clicking the 'choose file' button. Here's what that looks like:

![screenshot](/images/23/6.jpeg)

Ok, the last bit is the NSOpenPanel that I mentioned above. This code is very similar to the NSSavePanel that I mentioned with the download functionality, but it's just a really easy way to open Apple's built-in panels. Here's the code:

``` swift
let openPanel = NSOpenPanel()
openPanel.canChooseFiles = true
openPanel.allowsMultipleSelection = true
openPanel.begin(completionHandler: {(result) in
  if result == NSApplication.ModalResponse.OK {
      completionHandler(openPanel.urls)
  } else {
      completionHandler([])
  }
})

```


### fin
Ok friends, we just uploaded some files! Really easy right? From here we want to add some quality-of-life features, like a custom right-click context menu for the 'save as' functionality and the ability to set a default download location in the app's preferences. The world is your oyster. As always, and til next time, have a great day.
