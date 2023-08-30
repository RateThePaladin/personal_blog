---
title: Buy the dif
author: Robert
pubDate: 2023-03-22
number: '57'
draft: false
tags:
- Exploration
description: exploring
heroImage: /images/57/hero.png
---

### réalisation
This post!

### raison d’être
Hey y'all. This week’s post-able project is the next update to the pending transactions api that I've been working on. Although with all the new features and changes being made I'm hesitant to even call it a 'pending' transactions api... maybe just 'the api' will work for now. Anyways, for the past few days I've been setting up a transaction subscription of sorts, where a user can submit a wallet address to be constantly monitored for any outbound (and soon incoming) transactions. We can use this information to give our customers better insights into the status of their transactions (even if they make them off of dub), which could be very handy for higher value wallets. 

### le processus
The first thing we need to build to get this working is data persistence. We need this primarily to store the users and wallet addresses that we'll be monitoring. A standard MySQL database will work well for this purpose. In the last experiment, I built a Heroku plugin that allowed us to connect to our GCP MySQL database using the cloud sql proxy, so we can use that to ensure the express api always has an active connection no matter where it's being hosted. Check out my last experiment post [here](50) for more details on how that works. 

Now that our express app has a connection, let's set up our database! First we're going to make a users table that stores all the details we'll need to deliver information back to the user when a pending transaction is found for a given wallet. We'll be collecting the user's email, phone number, and eventually a device id for delivering the notification to the dub client. Here's what that table looks like:
![database](/images/57/users_table.png)
Ok great, now let's put together a place to store the wallet addresses that we'll be monitoring. Because we want one account to reference multiple wallet addresses, let's go ahead and create a new table to store the addresses. We can create a view later if we want to see all the relevant info in one place. Here's what that table could look like:
![wallets table](/images/57/wallets_table.png)

And last but not least, the transactions table! Here's where we're going to store any transactions that we detect are being sent from a monitored wallet address from the wallets table. This table is also where I kinda went on an retrospectively insane tangent. While adding transactions to the transactions table, I had an idea: why not just add every transaction? I thought this would be a great way to start collecting our own data rather than having to query the chain every time we wanted info. Plus, this would help us to start building historic data trends and would allow us to maintain a record of the transaction for ever step from queued to mined. So I said screw it and started adding every queued transaction added to the goerli network. Here's what the database looked like after 5 minutes:
![wallets table](/images/57/transactions_table.gif)

2700 new transactions in 5 minutes. Ouch. At that rate, our measly 100GB ssd would be filled in a few days. And remember, that's just the queued transactions. Most just go right to the pending pool, and all of this is just for goerli. Needless to say, my big data dreams got shut down pretty quick. Maybe I'll come back to this in the future when we either have our own servers capable of storing these huge data sets or actual revenue to pay google with. Either way, pin in that plan.

While I'm on the subject of adding the transaction info to the database, here's the javascript that actually does the formatting.

```
if (pendingTxArray != null) {
	pendingTxArray = jsonDataArray[0];
	queuedTxArray = jsonDataArray[1]

	const [status, q_data] = queuedTxArray;
	const q_addresses = Object.keys(q_data);
	const q_transactions = [];

	q_addresses.forEach((address) => {
	const q_transactionsForAddress = q_data[address];
	const q_nonce = Object.keys(q_transactionsForAddress);

	q_nonce.forEach((nonce) => {
	const [q_to, q_hash] = q_transactionsForAddress[nonce].split(": ");
const [q_value, q_gas] = q_hash.split(" + ");
	q_transactions.push({
	status: "queued",
	from: address,
	q_to,
	q_value,
	q_gas,
	nonce,
	});
});
});
```
I like this code because it's' much more computationally efficient than how I was previously finding wallet addresses. Basically, instead of searching for a needle in a haystack, it starts by splitting the hay up into its component parts. Each part can then do a simple comparison operation to see if it equals the needle. The best part is we can check each of these smaller piles at once rather than needing to wait for each one to complete. I used this method to completely overhaul how the api parses data, and the results were pretty crazy!
![wallets table](/images/57/postman.gif)
Check out those response times! We went from about a 80ms average to a 18ms average. It's almost 4.5x faster using the new sorting methods. Very nice.

### fin
Ok friends, I hope you enjoyed reading about this experiment! By next week I hope have a frontend on the api and allow people to start subscribing to transactions for their wallets. I should also have transaction notifications working in the next version of dub, so keep an eye out for that. As always, and til next time, have a great day.
