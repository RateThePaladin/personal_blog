---
# layout: ../../layouts/BlogPost.astro
title: Apple Keychain w/ web3.swift
author: Robert
pubDate: 2022-12-28
number: '11'
draft: false
tags:
- Feature
- Xcode
- web3
description: description
---
# Apple Keychain w/ web3.swift

### réalisation
https://github.com/dubdubdub-xyz/web3.swift-keychain

### raison d'être
Hey yall. This week's project is a continuation of last week's private key management with Apple keychain experiment. The link to that can be found [here](https://cms.experiments.gg/admin/content-manager/collectionType/api::experiment.experiment/42). In brief, Argent's web3.swift package we're using for the browser has a default insecure key storage implementation. I'm fixing that by saving an encrypted key to Apple's keychain.

### le processus
At the end of the last experiment, we could write content to and read content from the keychain. This was a great starting point, but we have a ways to go. The next thing we need to implement is the ability to get all Ethereum account addresses that our application has created. This functionality was needed to support the 'get accounts' function that web3.swift relies on to import saved accounts between restarts or reinstalls. This created some challenges, both in getting the metadata (and not the password)assigned to a keychain entry, as well as parsing all keychain entries into an array of strings that can be returned upwards of three or more levels. Check out the EthereumKeyStorage.swift file for details, but here's that keychain function:

```
    static func getWalletAddr(
        service: String,
        label: String
    ) -> [String]? {
        let query: [String: AnyObject] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service as AnyObject,
            kSecAttrLabel as String: label as AnyObject,
            kSecReturnAttributes as String: kCFBooleanTrue,
            kSecMatchLimit as String: kSecMatchLimitAll
        ]
        var result: AnyObject?
        var ethereumAddresses = [String]()
        if SecItemCopyMatching(query as CFDictionary, &result) == noErr {
            if let existingItem = result as? [[String: Any]] {
                existingItem.forEach { item in
                    ethereumAddresses.append(item["acct"] as! String)
                }
                print(existingItem)
                return ethereumAddresses
            }
        } else {
            print("Something went wrong trying to find the user in the keychain")
        }
        print (query)
        let ethereumAddressesNoOptionals = ethereumAddresses.compactMap { $0 }
        return ethereumAddressesNoOptionals
    }

```
This is not the best code in the world (you'll notice a few force unwraps) but it's a great example of how keychain metadata can be accessed and manipulated. This function, in addition to a couple of supporting functions for getSingleKey and getMultiKey, was the key to getting everything implemented in web3.swift.


### fin
Implementing this new key storage method into an existing but poorly documented package was a slog, but very worth it in our journey toward better web3 security standards. This is still far from the final implementation but provides a great (and functional) example to continue building upon.
