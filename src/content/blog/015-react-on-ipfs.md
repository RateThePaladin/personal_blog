---
title: react on ipfs
author: Robert
pubDate: 2023-01-04
number: '15'
draft: false
tags:
- web3
- React
description: description
heroImage: /images/15/hero.png
---
### réalisation
<iframe width="100%" height="300px" src="https://youtube.com/embed/eS0Wa3ttzSY" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

Check it out at [ipfs://QmdGsu4KvK7Uf7pDVePCKEfYD4Pnbp8q1yAvJsgT23y3cS](ipfs://QmdGsu4KvK7Uf7pDVePCKEfYD4Pnbp8q1yAvJsgT23y3cS)

### raison d'être
Hey, y'all. This week's project is a react app, built to be a calculator, hosted on IPFS, minted as an NFT, and resolved using a custom Cloudflare gateway and DNSLink. Welcome to the distributed web! Now, why would anyone ever want this? For one thing, a 'website' hosted on IPFS cannot be taken down by a third party. The content that you put there, stays there. We also get the benefits of IPFS's high uptime due to its distributed nature.

### le processus
We're going to start this project off with an open-source react app built by ahfarmer. Link to the GitHub is [here](https://github.com/ahfarmer/calculator). I'm using this one because it's cool and because it doesn't rely on persistent data, which is out of scope of this project. More research on this to come. For hosting this app on IPFS, I'm using Pinata for their free tier and easy-to-use API. I'm also using Thirdweb to deploy and interact with the smart contract.

Once we have our Pinata account created, we can build the react app with the 'npm run build' command. This will create a 'build' folder with our built app inside. After setting up the Pinata API, upload the build folder with 'pinata-cli -u ./build' command from the root project directory. This will command will spit out an IPFS CID, or content identifier. We can set this CID to the animation URL for the NFT that we're going to mint, mint said NFT, et voilà we're good to go! 


### fin
We can do some awesome things with web3 technologies - even adapt what we're used to in web2. By bringing common web2 developer tools to the web3 environment we can encourage people to build cool things for the distributed web.
