---
title: build-a-heroku
author: Robert
pubDate: 2023-04-12
number: '69'
draft: false
tags:
- Exploration
- Cloud
- Security
description: exploring
featured: true
heroImage: /images/69/hero.png
notes:
---

### réalisation
This post!

### raison d’être
Hey y'all. This week’s post-able project is just a short writeup on what I've been working on this week. With tax day right around the corner I had to spend last week away from vs code getting our books sorted out and filed. Because of the confidential (and entirely boring) nature of the majority of my work last week, I'll be briefly talking about  a small project I hosted and some interesting secret management work I did using doppler and good ol' fashioned bash scripting. The API we're hosting this week is a quick and dirty method of catching and diagnosing errors  in the dub browser.

### le processus
So the API is a basic express app. It has a few routes that take in data about the errors being reported and the build of the app via the body of the post request. Standard REST api stuff. These small express apps and APIs are pretty much the reason that Heroku and other 'do it all for you' hosting providers exist. They also usually have pretty simple and transparent pricing, but in our case, we want to burn as many GCP credits as humanly possible before they expire. So we'll be hosting our app on GCP's app engine. There's also an added security benefit to keeping everything within GCP. It allows up to only allow local IP connections to the database, meaning that any database queries are forced to go through our express API. This ensures that the sql injection protection and other database rules we setup are enforced and can't be overridden by communicating directly with the database. Also, despite the complexity, it's much easier than writing your own plugin for Heroku to get GCP's Cloud SQL Proxy working, which I did in the experiment post found [here](https://experiments.gg/experiments/50/). 

We need a couple of things to get our app piped up and working correctly. Here's the list of what you'll need to set up in GCP to get everything working together:
-  Database
	-  MySQL
-  Networking
	-  VPC group
		-  serverless VPC access group
		-  private subnet
	-  load balancer
		-  static public ip
		-  SSL cert for HTTPS
		-  firewall rules
		-  backend group
		-  another subnet
		-  custom domain rules
-  Hosting
	-  App Engine
		-  app.yaml config file
		-  database connection secrets
-  Secret management
	-  Doppler
-  SSL
	-  Cloudflare
		-  issue edge certificate
		-  DDOS protection
		-  DNS routing rules for our subdomain

Wow that's a long list! The problem that Heroku set out to solve is very much alive and well. I promise that this is easier than it sounds, and almost all of it can be done in the gui.

![meme](/images/69/coverpower.jpg)

##### Hosting
I'm going to start with hosting both because it's the easiest step and because it makes everything else easier. If you need any more details on how to get this setup and running, Google has a more in depth article [here](https://cloud.google.com/appengine/docs/standard/nodejs/building-app). For this writeup, I'm going to assume you already have a project created, billing enabled, and your node / express app setup and ready to host. 

The first step we need to take is to create a app.yaml file in the root directory for our project. This is basically a simplified list of instructions that gcloud will read and use to deploy our project. Here's what our app_template.yaml looks like:
```
runtime: nodejs16
env: standard
instance_class: F1
vpc_access_connector:
	name: {{.VPC_ACCESS_CONNECTOR}}
env_variables:
	USERNAME: {{.USERNAME}}
	HOST: {{.HOST}}
	PASSWORD: {{.PASSWORD}}
	DB: {{.DB}}
	KEY: {{.KEY}}
automatic_scaling:
	min_idle_instances: 1
	max_idle_instances: automatic
	min_pending_latency: automatic
	max_pending_latency: automatic
```
Feel free to play around with the env, instance_class, and automatic scaling setting to meet your needs! Fun note here, GCP's App Engine supports scaling to 0, meaning your app can turn on and off depending on the incoming request volume. This is perfect for projects that get minimal traffic, but will increase the response time significantly. 

So what are the strange {{.ENV_VARIABLES}}? And why did we name this file app_template instead of app? This is where doppler comes in! Doppler's CLI has a handy injection function that allows us to replace specifically formatted strings with our stored secret variables. This allows us to both have always up to date secrets across multiple developers and environments while also allowing us to commit the secrets template to github without exposing anything private. Once we have that set up, we can write a deploy script that looks like this:
```
#!/bin/bash

if ! command -v doppler &> /dev/null; then
	echo "Doppler is not installed. Please install Doppler before proceeding." >&2
	exit 1
fi

if ! command -v gcloud &> /dev/null; then
	echo "Doppler is not installed. Please install Doppler before proceeding." >&2
	exit 1
fi

  
# Proceed with the script

echo "Doppler & gcloud installed. Proceeding with the script..."

command doppler secrets substitute app_template.yaml -c prd --output app.yaml &&
command gcloud app deploy
```
This script uses Doppler to substitute the secrets, writes the update app.yaml to disk, and runs gcloud app deploy to deploy our app. Note here that the app.yaml file should be added to your .gitignore so your secrets aren't exposed on your next commit. And with that, our app is hosted! 


##### Networking
Now that we have our app hosted, we can move on to networking everything together! When you deployed your app, you'll notice that google automatically assigned your app a domain using the project name and the zone. If you want to update this to a custom domain (with a side of security benefits), read on!

This process can be pretty complex for a first time user, so if you need some more details you can find the full instructions [here](https://cloud.google.com/load-balancing/docs/https/setting-up-https-serverless). 

Start by going to the load balancer page [here](https://console.cloud.google.com/networking/loadbalancing/add?_ga=2.124264330.1894399155.1681243469-287473713.1659557423&_gac=1.217911652.1680557035.Cj0KCQjw8qmhBhClARIsANAtboeyD9cdoko-lR2vijXoGA7E99Wqu5_ll7tlHSez_aZO8rTaPVeom-MaAlghEALw_wcB). Follow the instructions in the article, with a couple of my additional notes. Make sure to select 'Global HTTP(S) Load Balancer (classic)' from the list, as the other options won't work with our existing app. For the protocol, select HTTPS to enforce SSL rules. Create a new static external ip address for the load balancer. When it asks you for a certificate, click add new. Now we go to Cloudflare!

Cloudflare is amazing because it's totally free and offers an entire suite of security features. Once you've set up your domain to use Cloudflare,  go to the 'edge certificates' tab and create a new certificate for the domain you want the app to use. This will give you a public certificate and a private key. Go back to the load balancers page, and upload these values to create a new certificate. Next, go back to Cloudflare and create a new A record for your domain pointing to the public ip address you created for the load balancer.

That should be the frontend of the load balancer covered! Now to create the backend config. Click 'create new backend service' and set the backend type to 'serverless network endpoint group'. Under new backend, select the cloud run service we created in the hosting step. Enter all the names, cache settings, any anything highlighted in red and click create. If all goes well we should now have a load balancer configured! If you navigate to the public IP in your browser, you should get a certificate error. Navigate to your custom domain and you should see your app!

*Note that your domain records and the load balancer may take up to a few hours to update. If it seems broken,  give it some time before troubleshooting*


### fin
Ok friends, I hope you enjoyed reading about some new hosting methods! While it's definitely more complex than setting up a new Heroku project, this gives our app a whole bunch of flexibility that it didn't have before, including autoscaling, load balancing, and Cloudflare domain protections.  To those of you keeping up with the Iron Dome project I've been building, next week should be the long awaited update and public roll out! As always, and til next time, have a great day.