---
title: cancel cancel cancel
author: Robert
pubDate: 2023-03-29
number: '61'
draft: false
tags:
- Exploration
description: exploring
notes:
- to add an image, add it to public/images, then use "![<alt-text-here](../../../public/images/image-name-here>.png)"
- to like to another experiment, use: "[<text-here>](<file-name-here>)"
- go to read view to see approximately what spacing will look like on the actual site
- learn markdown and don't cry about it
---

### réalisation
This post && a bunch of code
<iframe width="560" height="315" src="https://www.youtube.com/embed/zvVYSwobDoA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

### raison d’être
Hey y'all. This week’s post-able project is the realization of the [iron dome idea I wrote about in my experiment two weeks ago](54). The TL;DR from that post is that if we can detect transactions in the pending pool quickly enough, we can get the details and submit another transaction with the same nonce and higher gas to effectively cancel the first one we detected. The idea behind this feature is that we can effectively lock down a traditional EOA wallet by overriding any outbound transactions. What's more, because we can get all the details before a transaction leaves pending, we can selectively override any suspicious transactions. This could effectively function as a white list (or a blacklist) for all wallets being monitored. This would be so sick because it could save your bacon if you accidentally sign a malicious transaction. Ask Cam if you want to hear more about how easy it is to fall for one of these phishing attacks.

### le processus
After writing my experiment post I couldn't get this idea out of my brain. Instead of just letting it bounce around in there and disrupt my other work, I decided to take a week to see if it was even feasible. Low and behold, it was. But that's skipping too far ahead. 

Have you ever wondered what the 'cancel' button in metamask is actually doing or why it seems to fail so often if you don't cancel immediately? What's actually going on under the hood is more of an override rather than a true cancellation. Once a transaction has been broadcast to the network, there's usually no way of preventing it from being picked up by a node and mined. To get around this, you can effectively cancel a transaction by submitting another transaction with the same nonce and higher gas. This means that the node will pick up the new transaction and drop the old one. The biggest problem with this method is that it requires a user to catch the transaction while it's still pending. This is often nigh impossible as a transaction with a higher gas limit can be picked up within seconds of being submitted. What makes this problem worse is that the large majority of RPC providers don't give wallets access to pending pool information, meaning that any transaction submitted from a different wallet client can't be cancelled by the user. 

So then, I had an idea: if we're already indexing the pending pool for our pending tx api, couldn't we can just cancel any transactions that match a given set of wallet addresses automatically? I know, genious ✨. 

Just like a real iron dome, we need to build a radar to monitor for incoming targets and an interceptor to destroy them. For the radar, I'm going to use the pending tx api's backend and apply a whole bunch of fancy array magic to filter and format the data down to something usable. Here's where I just plop in a bunch of code and a brief explanation in the hopes someone asks me to explain in more detail:
```
async function cacheChain() {

console.log("starting cacheChain");
const filePath = 'PendingTxArray.json';

// Wait for 100ms between each iteration
const waitTime = 100;

// Keep track of the previous state of the transaction pool
let prevTxPool = {};

while (true) {
try {
\\ Wait before the next iteration
sleep.msleep(waitTime);

// Get the current state of the transaction pool
const txPool = await web3.eth.txpool.inspect().catch(console.error);

// If the transaction pool has changed since the last iteration, update the JSON file
if (!_.isEqual(txPool, prevTxPool)) {

const rawResultArray = Object.entries(txPool);
const jsonString = JSON.stringify(rawResultArray);

let defendedAddrs = await cacheWallets.updateWallets();
await dome.defend(defendedAddrs, rawResultArray);

fs.writeFile(filePath, jsonString, err => {

if (err) {

console.error(err);
} else {

console.log('File written successfully');
};

});

}else{
console.log("No change in transaction pool");
}

// Update the previous state of the transaction pool

prevTxPool = txPool;

} catch (err) {

console.error(err);

}

}

}
```

Ok this is the first part of the radar done. We're fetching the current state of the pending pool with a small delay between every run, write the results to disk, and keeping track of the pool data for comparison operations. We're also calling await dome.defend(defendedAddrs, rawResultArray). Note that we're passing two arrays: the first is a list of wallet addresses to monitor, and the second array is the current state of the pending pool. This is a powerful tool, but right now we basically have a giant list of everything in the pool. Let's do some filtering magic to get it into a filterable state:
```
async function defend(walletAddrs, txPool){

var pendingTxArray = [];
var queuedTxArray = [];

pendingTxArray = txPool[0];
queuedTxArray = txPool[1]

const [status, q_data] = queuedTxArray;
const q_addresses = Object.keys(q_data);
const q_transactions = [];

q_addresses.forEach((address) => {

if (walletAddrs.some((obj) => obj.wallet_addr === address)) {
console.log(colors.FgCyan, "iron dome: ~radar ping~");

const q_transactionsForAddress = q_data[address];
const q_nonce = Object.keys(q_transactionsForAddress);
q_nonce.forEach((nonce) => {

const [q_to, q_hash] = q_transactionsForAddress[nonce].split(": ");
const [q_value, q_gas] = q_hash.split(" + ");
const gas = q_gas.split(' gas × ');
const gasPrice = parseInt(gas[1].split(' ')[0]);
const gasUsed = parseInt(gas[0]) * gasPrice;

q_transactions.push({
status: "queued",
from: address,
q_to,
q_value,
gas,
gasPrice,
gasUsed,
nonce,
});

if (q_to !== address) {

console.log(colors.FgCyan, "iron dome: missle inbound with id " + nonce);
interceptor.intercept(address, nonce, gasPrice);
}
});
};
});

const [pendingStatus, p_data] = pendingTxArray;
const p_addresses = Object.keys(p_data);
const p_transactions = [];

p_addresses.forEach((address) => {

if (walletAddrs.some((obj) => obj.wallet_addr === address)) {
console.log(colors.FgCyan, "iron dome: ~radar ping~")
const p_transactionsForAddress = p_data[address];

const p_nonce = Object.keys(p_transactionsForAddress);
p_nonce.forEach((nonce) => {

const [p_to, p_hash] = p_transactionsForAddress[nonce].split(": ");
const [p_value, p_gas] = p_hash.split(" + ");
const gas = p_gas.split(' gas × ');
const gasPrice = parseInt(gas[1].split(' ')[0]);
const gasUsed = parseInt(gas[0]) * gasPrice;

p_transactions.push({
status: "pending",
from: address,
p_to,
p_value,
gas,
gasPrice,
gasUsed,
nonce,
});

if (p_to !== address) {

console.log(colors.FgCyan, "iron dome: missle inbound with trajectory id " + nonce);
interceptor.intercept(address, nonce, gasPrice);
}
});
};
});

const allTransactions = [...q_transactions, ...p_transactions];
```

Wow that's a lot! Filtering is hard work, especially when the input data is a bit of a mess. But with this, we've gone from getting notified every time anyone broadcasts a transaction to just wallet addresses on our list. We also do a very important check here with this code:
```
if (walletAddrs.some((obj) => obj.wallet_addr === address)) {
```

Basically just check to see if the to address === the from address. This will prevent us from trying to override our own transactions, which creates a very expensive infinite loop.
Ok now that we have the transaction and the nonce, we can shoot it down! This is the second part of the system I mentioned before. This part is really easy, just create a 0 vale transaction with the same to and from address that gets passed into the function. No code example here, but we're using web3.js to handle everything. Just sign and broadcast said transaction and we've successfully prevented a transfer attack! Rejoice.

And yes, I did just totally brush over the signing process. Right now I'm just using a secret variable containing the private key, but this isn't scaleable at all. We're going to have to shake some things up if we don't want to store a user's private keys, which is a security no go. Come back next week for more info on how I'm going to solve this problem.

### fin
Ok friends, I hope you enjoyed reading about this experiment! I think this api could have some pretty important security implications, especially as we wait for smart contract wallets to gain mass market adoption. Next week I'm going to be writing about how we solve the gas and private key problems, so look forward to that post! As always, and til next time, have a great day.