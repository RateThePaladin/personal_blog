---
title: Pend TX && Web3.js
author: Robert
pubDate: 2023-02-22
number: '42'
draft: false
tags:
- Progress
description: description
---
### réalisation
<iframe width="560" height="315" src="https://www.youtube.com/embed/Vsy6z4Y4Eqw" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### raison d'être
Hey yall. This week's postable project is the ability to get pending transaction details from EVM blockchains. Sounds pretty easy right? Well, you'd be surprised. While the methods for fetching this data are well documented, the large majority of RPC providers like Infura and Alchemy expressly disable this feature as it's highly CPU and bandwidth-intensive. They couldn't make the economics work. This leaves a couple of options for determining if a transaction is still pending. 

The first is the Uniswap approach: make a post request to the wallet's RPC provider every few seconds to see if the transaction has been added to a block yet. If it has, the transaction is no longer pending. This approach is beneficial only in that it is easy to set up. While it seems to work fine from a user's perspective for most transactions, it creates major problems if the transaction were to stall or fail outright. In either of these cases, Uniswap will display the 'pending' label for hours. Not great. The second approach is deploying your own RPC provider. This will allow your app to query the data in the pending transaction pool, including data about the TO and FROM addresses, gas limits + gas usage, the wallet's nonce, and more. Using this approach, we can more reliably diagnose issues with stuck transactions and get details about the progress through the network.

### le processus
Deploying your own Ethereum node is fairly easy. The first decision we need to make is the type of node to spin up. Your options are full, archive, and light. You can read more about that [here](https://developers.cloudflare.com/web3/ethereum-gateway/concepts/node-types/). We'll be using a full node because it provides us with access to the large majority of on-chain data without the storage requirements of an archive node. Next, you need to select what client you'll be using. I recommend Geth (or go-ethereum), as it has a large volume of support info. Info can be found [here](https://geth.ethereum.org). Now for the fun part. If you're deploying the node on your local computer, you'll have to handle port forwarding so requests can reach your local device. I would recommend setting up a reverse proxy for this task to avoid opening common ports, as this can be a major security vulnerability.

If you have a ton of cloud credits for AWS as we do, I would recommend using their managed blockchain service. You can check it out [here](https://aws.amazon.com/managed-blockchain/). The benefits of letting a cloud giant like amazon handle your web3 infra include easy scalability, GUI configuration, high uptime/reliability, and much more. Just note that handling RPC requests, especially at scale, is a resource-intensive application. This can cost a lot of money if you're not careful with your utilization. Keep an eye on it! Also, as a general practice, cloud billing alerts are great and can save you from waking up to a $30,000 bill in your inbox.

After we have the RPC set up and configured, we can pull some data! I'll be using web3.js for this task, as web3.swift doesn't support the extensions we'll need to interact with the geth client. If you're using AWS like we are, the first step will be to set up your credentials. This is a bit of a pain in the rear but prevents your expensive node from being accessed by the open internet.

```
const Web3 = require('web3');
const AWSHttpProvider = require('@aws/web3-http-provider');
const credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    billingToken: process.env.AWS_BILLING_TOKEN
  }
const web3 = new Web3(new AWSHttpProvider('https://your-node-address-here?billingtoken=' + credentials.billingToken)); 

```

You're also going to want to install the following npm packages: [@aws/web3-http-provider](https://www.npmjs.com/package/@aws/web3-http-provider), [@aws/web3-ws-provider](https://www.npmjs.com/package/@aws/web3-ws-provider), [web3](https://www.npmjs.com/package/web3), and [aws-sdk](https://www.npmjs.com/package/aws-sdk). After everthing is installed, export your AWS accessKeyId, secretAccessKey, and billingToken. We'll need these secrets for the AWS provider packages to sign our requests.

Now that we have our project set up and configured, we want to start by building out the extensions to web3.js that we need to query our geth node. Important to note here that AWS only supports a specific list of RPC calls.
```
web3.eth.extend({
    property: 'txpool',
    methods: [{
      name: 'content',
      call: 'txpool_content'
    },{
        name: 'maxPriorityFeePerGas',
        call: 'eth_maxPriorityFeePerGas'
      },{
        name: 'getWork',
        call: 'eth_getWork'
      },{
      name: 'inspect',
      call: 'txpool_inspect'
    },{
      name: 'status',
      call: 'txpool_status'
    }]
  });
  ```

Great! We have our extensions written. The last thing we need to do is call our inspect extension created above to get a whole flood of pending transactions. That can be done with a bit of code like this:

```
web3.eth.txpool.inspect().then(console.log).catch(console.error);

```

Easy! If everything works, you should get a list of data similar to what can be seen in the implementation video at the top of the page.


### fin
Ok friends, this week we took the first step towards creating an API for getting pending transaction data. As the AWS team hasn't made any of their signature packages available in Swift, we can't query our node from the app directly. Instead, I'll be building an API to act as an intermediary between the dub application and our eth node. Still a lot of work to do, but it was great to build this as a proof of concept. As always, and til next time, have a great day.
