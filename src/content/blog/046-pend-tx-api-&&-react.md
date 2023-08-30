---
title: pend tx api && react
author: Robert
pubDate: 2023-03-01
number: '46'
draft: false
tags:
- API
- React
- web3
description: description
heroImage: /images/46/hero.png
featured: true
---
### réalisation
<iframe width="100%" height="300px" src="https://www.youtube.com/embed/bl0mk5lOO5s" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

~~Check out the app [here](https://pending-tx-onmf546o3-dubdubdub-xyz.vercel.app)~~ App no longer hosted, check out the video above

### raison d'être
Hey yall. This week's postable project is turning the pending tx data we can get from our Goerli node into a REST API. We wanted to do this so we could query the API's endpoint from dub to get back data on pending transactions. This will help us give users further insight into the current state of their transactions. Additionally, having the pending tx data can help diagnose failed transaction states. Instead of Uniswap's infinitely spinning 'pending' badge, we can show users the transaction and steps they can take to resolve any issues (aka bad nonce, low gas, bad hash, etc).

### le processus
We left off last week with an ethereum node deployed to an Amazon-managed blockchain instance and the ability to query the node directly. For this to become a functional and useful API, there was a huge list of features that needed to be implemented. The first (and most annoying) was filtering the data being received to look for a specific wallet address. This should have been very easy, but unfortunately, the data being returned by the node wasn't standard JSON. It was (*mostly*) JSON, but had some random breaks that prevented the data from being parsed. To solve this issue, I needed to stringify the blockchain data and create a multi-dimensional array consisting of said data with the 'from' address as the key for each object. If this sounds pretty slow and cumbersome, well, it is. I was getting almost 800ms of latency for each request. Not great if you're trying to send a request every second. This method also sent our CPU utilization skyrocketing on AWS, which costs us credits. Ouch.

So, what was the solution to our data problems? Caching! Instead of reading the data from the goerli node every time a user makes a request, what if we pulled the data from our own JSON file saved to disk locally? This would allow virtually unlimited requests to the API without increasing utilization on the node itself. Very handy for a use case that involves sending hundreds of GET requests for every transaction in the app.

To get this working we need a couple of key things. The first is the ability to write data to disk. While this is easy to achieve with the javascript fs.writeFile() method, this precludes us from hosting the app on any serverless infra. This rules out Vercel. We could cache data to a separate SQL or postgres database, but that will increase the latency we were trying to reduce. For now, we're going to be using the first fs.writeFile() method and hosting the app with Heroku to avoid the serverless problem. 

Once we have our write figured out, we need to find a way to keep the local JSON file in sync with the node. To do this, we'll be using a WebSocket and a pending tx subscription. The nice thing about a WebSocket connection between our API and the goerli node is that the node can announce new data back to the API rather than needing to query it on a set interval. This means that we can sync the current state of the chain back to the API without spamming requests. With the caching figured out, our API should look like the following diagram: 


![image](https://i.ibb.co/74cYRs3/Clean-Shot-2023-03-01-at-17-39-13.png)
<br/>
Great! We now have an API setup to return data for a given wallet address. From here, we need to do all the traditional and boring API things. Here's a list of what needs to be setup up:
* secret management for AWS and provider
* routes / endpoints
* rate limiting
* input validation
* CORS
* https cert
* load balancer
* autoscaling (if using containerization)
* API keys
* billing (check out stripe)


Last but not least, we need a front-end setup for testing. Most testing can be done from Postman, but I'm going to stand up a react app to show off what the API is capable of handling. This was mostly just for the external experiments post as we'll be using app notifications going forward, but it was a great exercise into how to display this info to users. I'm not going to go into depth into creating and styling a react app, but check out the [Traversy Media Crash Course](https://www.youtube.com/watch?v=w7ejDZ8SWv8) on YouTube for a great guide.


### fin
Ok friends, this week I had some fun building the API and the react frontend for showing off the pending tx data. Ngl it was nice writing in javascript after spending so much time in swift. VS code gang. Anyways, the pending tx API is a great first step for us towards better customer insight into transaction details, and will be a great jumping-off point as we start to do failed transaction detection as handling in dub. As always, and til next time, have a great day.
