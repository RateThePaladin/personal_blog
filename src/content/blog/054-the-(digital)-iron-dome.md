---
title: the (digital) iron dome
author: Robert
pubDate: 2023-03-15
number: '54'
draft: false
tags:
- Security
- web3
description: exploring
heroImage: /images/54/hero.png
---

### réalisation
This post!

### raison d’être
Hey y'all. This week’s post-able project is... this write up! We're off work this week but still wanted to write something up for the experiments post. I wanted to write about an idea for a new wallet security feature that came to me recently in the shower. Fair warning, this idea is completely untested and this write up will be mostly stream of thought. But it sounds interesting in my head, so here we go!

### le processus
We all know about crypto scams and how prevalent they are in our industry. The majority of these scams involve a form of social engineering, attempting to get users to sign an obfuscated transaction that grants the bad actor access to your wallet. Once that happens there's very little a user can do to prevent all of the assets from being transferred out of their wallet. Even if the user notices they've been scammed, at this point it's too late. There's no way to prevent transfers out of your wallet.

There are a couple conventional defenses against this happening. One common solution is the use of a hot and a cold wallet. The hot wallet is usually attached to your browser and is what you use to sign transactions, and the cold wallet stores your valuable assets. This way, even if you do end up signing a message that gives access to your wallet, there's nothing in your hot wallet to transfer out. While this helps address the issue, it has a couple key issues. Namely it still relies on user action, both on the initial setup and as an ongoing practice. It also does nothing to address the underlying issue: anyone with access to your wallet can transfer out your assets. 

What I want to build is a defense system of sorts. When working with the pending transaction pool, I realized that you can monitor all transactions to and from a given wallet address. This info is critical to how we notify users about pending transactions and give them insight into the current status. We can also use this info to send failure notifications and offer solution suggestions for common problems, such as bad gas or out of order nonce. But we might be able to use it for another purpose.

Before transactions get picked up by a node and validated, they hang out in the queued or pending pool for a bit. Usually once they're there, there's very little you can do to stop the transaction from getting picked up. What you can do, however, is get the nonce value of the transaction. And the handy thing about two transactions with the same nonce is that the new one will override the old one, no matter what the content of the transaction. This means that, if we're fast, we can stop any transfers going out of a given wallet by overriding the transaction with a zero value transfer and the same nonce while it's still in the pending pool. This method would have a couple drawbacks, such as spending gas to override every pending transaction and requiring a user's private keys to submit a new zero value transaction on their behalf. Despite these drawbacks, I believe this feature could offer significant value to high value wallets who want an added layer of security for their assets.

![missile-defense](/images/54/missile-def.png)

I like to think of this system kinda like a counter missile system, like the iron dome. Instead of trying the prevent the transactions from happening in the first place, we monitor a specific area for a transaction and then shoot it down before it can leave the pending pool.

### fin
Ok friends, I hope you enjoyed this thought experiment! Reminder that this is not a feature we currently have on the roadmap but rather a cool thought experiment for a future project. If it was interesting or you have any ideas on why this would or would not work, I would love to hear from y'all! As always, and til next time, have a great day.
