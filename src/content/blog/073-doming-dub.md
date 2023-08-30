---
title: doming dub
author: Robert
pubDate: 2023-04-19
number: '73'
draft: false
tags:
- Security
- web3
description: exploring
notes:
- to add an image, add it to public/images, then use "![<alt-text-here](../../../public/images/image-name-here>.png)"
- to like to another experiment, use: "[<text-here>](<file-name-here>)"
- go to read view to see approximately what spacing will look like on the actual site
- learn markdown and don't cry about it
heroImage: /images/73/hero.png
---

### réalisation
This post & dub v0.2

### raison d’être
Hey y'all. This week’s post-able project is the culmination of the iron dome project I've been working on for the last few weeks. I know, very exciting. Unfortunately thought this is more of a good news bad news type of situation. Starting with the bad news (as everyone should), I'm confident in saying that the signature method I described in [experiment #65](https://experiments.gg/experiments/65/) is not technically feasible in the way I imagined. I'll go more in depth into the technical problem below, but the tldr is that the large majority of wallet providers including MetaMask, Coinbase, WalletConnect and Rainbow don't support the 'eth_signTransaction' method that I need. This means that I can't just spin up a React app to onboard new users without collecting their private keys, which is a non starter. 

Here's the good news: ***we're building the iron dome into dub browser.***  

### le processus
Quick recap for those who aren't up to date on the project: in order to get around requiring a user's private keys to override a transaction, we want to have them pre-sign a whole bunch of zero value transactions with incrementing nonces, saving each to a database. That way, when we detect a malicious transaction,  we can broadcast the pre-signed transaction without a user's input. No need to save a user's private keys, meaning that even in the event of a security breach there's no risk to user assets. Pretty neat.

Unfortunately, this idea relies on the ability to sign a transaction with a custom nonce without broadcasting it to the network immediately. This is where the eth_signTransaction method comes into play. This method would allow us to do pretty much exactly what we need. However, it's not supported by almost every wallet provider under the sun. The reason given is that it would allow dapp developer's to bypass a wallet provider's  control of the nonce value of each transaction. This would mean reduced user visibility into the status of a transaction as well as the ability for a dapp to effectively 'brick' a wallet by submitting a transaction with an out of oder nonce. Here's the link to the Github discussion on this topic if you want to read more in depth into this problem:
[![meme](/images/73/github_embed.png)](https://github.com/MetaMask/metamask-extension/issues/3475)

Despite MetaMask's hesitance to allow this feature, I believe that developers should be given the tools to build hybrid dapps by taking advantage of the eth_signTransaction method. And as there's no underlying security vulnerability with this method, I believe it's a UX problem that we can solve. 

So, if no existing wallets are willing to tackle the data & UX problems blocking the implementation of the eth_signTransaction method, we'll simply do it ourselves. With that, I'm excited to announce that we'll be building the iron dome directly into dub browser. While it's not coming in this version (we still have some core functionality to build), it's scheduled to be included in v0.2. 

### fin
Ok friends, I hope you enjoyed reading about the final (for now) iron dome update! Thank you to everyone who joined me for this crazy journey into the inner workings of EVM chains and new implementations of existing tech. I'm very excited to see the culmination of this idea once we integrate it into the browser. Next week I'll be back in Xcode with Anupam & Cam working on some additional core features. As always, and til next time, have a great day.