---
title: keying your accounts
author: Robert
pubDate: 2023-04-05
number: '65'
draft: false
tags:
- Cloud
- Security
description: exploring
notes:
- to add an image, add it to public/images, then use "![<alt-text-here](../../../public/images/image-name-here>.png)"
- to like to another experiment, use: "[<text-here>](<file-name-here>)"
- go to read view to see approximately what spacing will look like on the actual site
- learn markdown and don't cry about it
heroImage: /images/65/hero.png
---

### réalisation
This post!

### raison d’être
Hey y'all. This week’s post-able project is this writeup on how we're hoping to manage signatures in the iron dome project that I've been working on. At the core of the transaction defense strategy is the ability for the API to override an existing transaction by _autonomously_ broadcasting signed transactions with the same nonce. Without this functionality, the API would be able to do nothing more than notify a user that a transaction has been submitted. But as we all know, signing a request requires a private key. This post is an writeup on the potential strategies, benefits, and drawbacks to different methods of handling in flight sensitive user data.

### le processus
Alright, time to dive into some interesting private key management methods! 

##### The Obvious (and (potentially) insecure) Method
The first and most obvious method we considered was just storing a user's private key during the sign up process. Having the private key on hand and easily accessible makes the job of signing a replacement transaction a breeze. Just grab the key from the database for a given wallet, feed in the transaction parameters, sign and broadcast. Easy as that. This method would also involve very few modifications to the existing code base,  as it's pretty much how I ran the entire proof on concept API while testing. 

So in the pros category, it's pretty much just the word 'easy'. However, as with the majority of simple solutions, it has a crap ton of vulnerabilities. First, we're storing a user's private key. Not good! If our database were to be compromised it could lead to the unrecoverable loss of assets, which is an unacceptable risk for a security focused product. Additionally, it would allow our team to intentionally or even unintentionally modify a user's assets without their knowledge.  As the saying goes, with great power comes great responsibility. I very much don't want this power.

Ok so pros and cons of just storing a user's private key in a database:
- Pros
	-  Easy
	-  Known working solution
	-  Very very fast (less likely to miss a transaction)
- Cons
	-  Huge security problem
	-  Potential loss of user assets
	-  Potential liability for user's assets
	-  Intentional (or unintentional) access to user assets by our team

With that list of 'cons', _we're going to avoid this method like the plague._ It would be highly irresponsible and against pretty much every security practice on the planet. Honestly, I just wanted to include this section to highlight why ***we would never use this method***.

##### The KMS (no, not that kind) Method
So after reading the last section, you might think "so why not just encrypt the private key?" That is a great question my attentive and imaginary friend. Most of the time, when you create a password for a website, the site does some encryption magic so that it never has to store the password itself, but rather a non-reversible key. That way when you go to log back in, the site re-encrypts the password you typed in and tests to see if it matches the stored encrypted password. If it does, you're in. This method ensures that both the site's owners and any would be attackers can never read your password.

However, our API *needs*  to read an unencrypted private key if it wants to sign a transaction on your behalf. This is where Google's KMS, or key management system, comes in to play. KMS allows an application to encrypt, store, and importantly, decrypt sensitive user data while ensuring that no plain text passwords are ever stored. This reduces the risk of malicious access to private key data significantly while still giving the API the ability to sign the replacement transaction autonomously and on the fly.

-  Pros
	-  no plain text private key stored
	-  industry standard encryption practices
	-  reasonably fast access to raw key data
	-  supports tot (time of transaction) signatures
	-  auth via existing cloud sql proxy
-  Cons
	-  still requires a user to grant us access to their private key on signup
	-  leaves a potential attack vector open via the encryption key
	-  does not eliminate possibility of abuse by a member of our security group

This method is a lot better than storing a plain text private key, but it's nowhere near perfect. If the encryption key were to be compromised, the entire dataset could be at risk. Additionally, if a bad actor were to gain access to our google accounts, they could modify security keys and potentially view sensitive user data. In summary, while this method is fine for less sensitive applications, the nature of this project requires us to eliminate even unlikely attack vectors.  

##### The Not (or what if we didn't) Method
So there are lots of problems with storing a user's private keys. So what if we didn't? "Wait!", I hear you say, "Didn't you need the private key to sign a replacement transaction?" Why yes, dear reader, we do. But what if we reframed the question a bit? Let's start by breaking down the elements of a typical evm transaction:

```
"0xf2786d7251e75875b0fB8d489Ccf6C3736029D27":{"68":"0xf2786d7251e75875b0fB8d489Ccf6C3736029D27: 0 wei + 283155 gas × 101778321690 wei"}
```

So every transaction is "from_wallet_address": {"nonce":"to_wallet_address: transaction value + gas x price per gas"}. But what info do we really need from this transaction in order to over ride it? Well the "from_wallet_address" and "to_wallet_address" will always both be the address of the wallet we're monitoring. The "value" will always be 0, and we can set the "gas" and "price per gas" in advance by just making them a really high value. With all of this info already set in stone, all we need to fetch dynamically is the nonce of the transaction.

That still presents a problem. How do we sign a transaction for an unknown nonce without the private key? What if, instead of  signing a replacement transaction at the tot (time of transaction), we bulk sign 0 value transactions with incrementing nonce? This way the user could use their existing wallet client and there would be no need for us to store a user's private key. We would just store the pre-signed transaction, the nonce for that transaction, and the wallet address in a KMS encrypted database and when we detect an incoming transaction we broadcast the pre-signed one with that same nonce. Great idea right? Let's do our pros and cons.
-  Pros
	-  Never storing a user's private key
	-  No chance of losing a user's assets
	-  Extremely private, as the only thing being stored is an encrypted signature and a nonce
	-  Easy onboarding with bulk signatures
	-  No chance that the dub team can access the assets in your wallet
	-  No liability
-  Cons
	-  Difficult to set up, but worth it!
	-  Requires a front end for onboarding
	-  Takes slightly more time to broadcast replacement transaction

Let me cut right to the chase, this is how we're going to be handing private keys (by not handling them)! This should maximize privacy, reduce potential attack vectors, and still maintain all the functionality of the api!

### fin
Ok friends, I hope you enjoyed reading about this experiment! This was more of a thought experiment and an explanation on how we're handling and securing sensitive user data rather than a feature preview, but I hope y'all enjoyed reading non the less! As always, and til next time, have a great day.