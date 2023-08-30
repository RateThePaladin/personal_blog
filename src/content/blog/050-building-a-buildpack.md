---
title: building a buildpack
author: Robert
pubDate: 2023-03-08
number: '50'
draft: false
tags:
- Cloud
- Open Source
description: exploring
heroImage: /images/50/hero.png
featured: true
# home: true
---

### réalisation
<!-- ![github repo preview image](/images/50/heroku-buildpack-cloud-sql-proxy.png) -->
Check out the repo [here](https://github.com/RateThePaladin/heroku-buildpack-cloud-sql-proxy)

### raison d'être
Hey yall. This week's postable project is an update to the transactions api that I've been working on for the past few weeks. The observant among you might have noticed that I'm no longer calling it the 'pending' transaction data api, and that's because we've expanded the scope! Scope creep comes for the best of us. Our original plan for getting blockchain data outside of the pending pool was to query etherscan, the largest data aggregator out there. However, upon googling their api pricing structure, we have pivoted to doing it ourselves. This increase in data requirements means an increase in data storage, and so, we'll be using a standard mysql database to store everything. This sounds easy (as usual) but ended up being... interesting, to say the least.

### le processus
Those experienced developers among you might have already spotted a problem I missed. We're hosting the express API on Heroku, and the MySQL database on GCP. How do we connect to the database securely? Hosting the api on a different provider means we can't use local requests to the private ip address. Heroku is also a ephemeral hosting provider, meaning that the connection requests could be coming from an almost limitless set of IP addresses. This rules out any ability to set host restrictions. Any easy solution here is to allow connection requests from any IP address, but any prospecting internet troll who catches us doing this could flood our server with enough connection requests to kill performance or break the authentication. Not ideal. Enter, the difficult to implement solution to our problem: GCP's Cloud SQL Auth proxy. 

The SQL Auth proxy is a reverse proxy between our MySQL database and the api on Heroku. This would allow us to send requests to the database as if it were on localhost while having an end to end encrypted tunnel protecting our connection from the open internet. Google offers a lot of great ways to install and configure the proxy, including mac, linux, windows, and even docker methods. If you're connecting from one of these devices, doing so is exceptionally easy. Here's what that connection request would look like:
![github repo preview image](/images/50/experiment_50_image_1.png)
Heroku's servers are running a version of Linux, so google does have a compatible version of the SQL Auth proxy, but how do we actually download and image to the Heroku server? It's not like we have an EC2 instance we can just ssh into and configure. That's where Heroku's system of build packs comes into play. Using the build pack architecture, we can write a script to download the SQL Auth proxy, set up our permissions, and establish a connection back to our SQL server using credentials stored as environment variables.

💡 Side note here, I *highly* recommend setting up a secret management platform such as Doppler. This will make syncing sensitive data between your dev environment and various production servers a breeze. 💡

Ok back to the main programming. What we need here is basically just a complicated bash script to handle the downloading, extracting, permissioning, and authenticating the proxy. You can see how everything works in the repo linked at the top of the page, but here's the main file to handle most of these tasks:
```
#!/bin/sh

set -e

BUILD_DIR=$1

CACHE_DIR=$2

ENV_DIR=$3

if [ ! -f $CACHE_DIR/cloud_sql_proxy ]; then

mkdir -p $CACHE_DIR

fi

echo "-----> Downloading cloud_sql_proxy"

wget https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.0.0/cloud-sql-proxy.linux.amd64 -O $CACHE_DIR/cloud_sql_proxy

echo "-----> Vendoring cloud_sql_proxy into slug"

if [ ! -d $BUILD_DIR/google/bin ]; then

mkdir -p $BUILD_DIR/google/bin

fi

cp $CACHE_DIR/cloud_sql_proxy $BUILD_DIR/google/bin

chmod +x $BUILD_DIR/google/bin/cloud_sql_proxy

PATH="$BUILD_DIR/google/bin:$PATH"

if [ ! -d $BUILD_DIR/bin ]; then

mkdir $BUILD_DIR/bin

fi

cat >$BUILD_DIR/bin/run_cloud_sql_proxy <<EOF

#!/bin/sh

echo "-----> Adding credentials JSON"

printf "%s" "\$GCLOUD_CREDENTIALS" | base64 --decode > /app/google/credentials.json

exec /app/google/bin/cloud_sql_proxy \$GCLOUD_INSTANCE --credentials-file=/app/google/credentials.json --quiet &

EOF

chmod +x $BUILD_DIR/bin/run_cloud_sql_proxy

exit 0
```

I won't go too far in depth into how this works, but it essentially makes sure that we have the proxy downloaded and creates a script to run the proxy when the express server starts up.  If you're setting this up for yourself, I highly recommend removing the --quiet flag so you can get the full debug output whenever the app runs. After establishing this connection, we can connect to the database as if it were running locally! Nice, love when things work.

### fin
Ok friends, we didn't get too much done because of the short week, but our work here should set us up for success when we're back from break and grinding to get the app releases. We now have the connection between the API and the database that we're going to need for our more advanced data pipeline shenanigans. As always, and til next time, have a great day.