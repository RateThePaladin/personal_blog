---
title: key management w/ keychain
author: Robert
pubDate: 2022-12-21
number: '7'
draft: false
tags:
- web3
- Security
- Xcode
description: description
heroImage: /images/7/hero.png
featured: true
---
# Private Key Management w/ Apple Keychain

### réalisation
<iframe width="100%" height="300px" src="https://youtube.com/embed/AAT2XCSYxuE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

https://github.com/dubdubdub-xyz/keychain-playground/tree/master/keychain-playground

### raison d'être
web3.swift is, as the name suggests, a swift package used to manage all things web3. Much like web3.js, it has the ability to generate a new EOA wallet (using the private key -> public key -> wallet address method), call smart contracts with their ABIs, and much more. However, by default web3.swift uses the EthereumKeyLocalStorage() method which stores private keys in your device's cache directory. Not great. We're going to implement new functionality to store private keys and all associated encryption metadata in Apple's keychain.

### le processus
Implementing apple's keychain methods is a pretty well documented process. The core of the process are the SecItemAdd, SecItemUpdate, SecItemDelete, and SecItemCopyMatching functions. Said functins require a specific query to be passed in as a CFDictionary containing kSec objects. For more details on this process (and a working example), checkout the ContentView.swift file in the repo linked at the top of this page. The important note here is that the kSecValueData object is where we will be storing the private key data, formated using utf8.

After we have a working version of the add and get functions written we can enter the vast world of "Integration Hell". The four functions in the web3.swift package that we need to overwrite are contained in the EthereumKeyStorage.swift file. Instead of storing the generated private key in a file structure, we want to convert it to a data object that can be stored as a kSecValueData field of the keychain entry. Once this is working, it should look like the video at the top of this post.

Lastly, we need to read the data back from the keycahin. This is actually a bit harder than it sounds, as we need to ensure we select the correct private key for the wallet address being passed in. Normally this could be done by filtering by the kSecAttrAccount string, which we have set to the wallet address. Unfortunately, web3.swift implements a custom object called EthereumAccount that contains the wallet address. So to grab the correct private key for a given EthereumAccount, we need to unwrap the object into a string that we can then use to query the keychain. The final (working) implementation of this code will be available on our github under our version of the web3.swift package.

### fin
Implementing secure key storage is paramount to building the next generation of browser. Thankfully, Apple makes it pretty easy to implement.
