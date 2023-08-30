---
title: gasless mint & scw v0.01
author: Robert
pubDate: 2022-12-14
number: '3'
draft: false
tags:
- Exploration
- web3
description: description
heroImage: /images/3/hero.png
# featured: true
---
# On Gasless
Gasless transactions are the future of web3 interactions and a necessity for maintaining web2 interaction styles. If wallets are to become the new account infra for the internet, gas needs to go. Imagine needing to connect a credit card and pay (even a few cents) for an Instagram account. It just won't work. This is not a new idea by any means, but current implementations are few and far between. Listed below are a few existing methods and test implementations to play around with.

### The Relayer Method
To enable gasless transactions on EOA wallets like metamask we need a custom smart contract and a relayer. The relayer, as the name implies, listens for a transaction from a whitelisted wallet and relays the info to the recipient’s address. Said relayer can be configured to cover the gas fees using a pre-funded pool. While this method maintains compatibility with a majority of the existing wallets and providers, it requires specific implementation in the smart contract, dapp, and relayer. So not great for generalized gases.

An example of this implementation can be found at [gasless minting.](https://dubdubdub-xyz.github.io/gasless-mint/)

### The Smart Contract Wallet Method
To make gasless transactions more ubiquitous, we can look to smart contract wallets (SCWs). SCWs let you define all wallet functionality through code, including the ability to pay for gas without a relayer. Nice! Here's a working example: [Polyscan link](https://mumbai.polygonscan.com/address/0xe5f544be759CeEd5f46445B9D854546561Db4e0d#code)

Take a look at the code, and you'll notice it's remarkably simple. But SMCs require some additional work on the dapp side to get working. Less nice. So in the end, we need to make it easy for a dapp developer to enable gasless transactions.

