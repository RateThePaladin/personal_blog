---
title: fail2banned
author: Robert
pubDate: 2026-04-05
number: '85'
draft: false
tags:
- Security
- Cloud
description: first post back, and the story of quieting a noisy proxy with fail2ban
heroImage: /images/85/hero.png
---

### réalisation
This post, the [learning-path repo](https://github.com/RateThePaladin/learning-path), and a much quieter proxy.

### raison d’être
Hey y'all. This is my first post back in a few years, which feels both a little weird and very nice. I stopped writing here for long enough that I probably owe the blog an actual re-introduction, but the short version is that I've still been building, breaking, and fixing things the whole time. Lately I've been collecting the public-safe versions of those learnings in my [learning-path repo](https://github.com/RateThePaladin/learning-path). The goal is simple: write down the useful bits before they evaporate from my brain.

A good example showed up almost immediately. Public-facing hosts attract an endless parade of junk traffic, scanners, and login attempts. None of this is especially surprising, but it does get old fast. I wanted something better than "watch logs and sigh." I wanted bad traffic banned automatically, I wanted the bans to happen at the edge instead of only on the box itself, and I wanted alerts that were useful enough to read instead of useless enough to mute.

That made this a pretty good post to come back with. It's practical, it's public-safe, and it solved a real annoyance instead of just making me feel productive for an afternoon.

### le processus
The setup started with Fail2Ban doing two distinct jobs. First, protect SSH locally. Second, watch the public proxy logs and push bans out to Cloudflare so the bad actors get stopped before they keep hammering the server. That split ended up being the big quality-of-life improvement because it let me treat private access and public noise as two separate problems.

The core config looks like this:

```ini
[DEFAULT]
ignoreip = 127.0.0.1/8 ::1 100.64.0.0/10
bantime  = 1h
findtime = 10m
maxretry = 1

bantime.increment = true
bantime.maxtime = 5w
bantime.multipliers = 1 24 168 672

[sshd]
enabled  = true
port     = ssh
maxretry = 3
bantime  = 1h
action   = telegram

[npm-botsearch]
enabled  = true
port     = http,https
logpath  = /proxy-host-*_access.log
backend  = auto
action   = cloudflare-token
           telegram
```

There are a couple of things I really like here. One is the `ignoreip` line, which whitelists localhost and the Tailscale CGNAT range so I don't accidentally build a very exciting self-own machine. The other is the incremental ban setup. A one hour ban is nice. A one hour ban that turns into a day, then a week, then four weeks if the same IP keeps coming back is much nicer.

The `npm-botsearch` jail is the one doing the fun part. Instead of only blocking an IP on the local host, it hands the action off to Cloudflare so abusive traffic gets cut off at the edge. That doesn't make the internet stop being the internet, but it does make the logs a lot less noisy.

![sanitized fail2ban config](/images/85/cloudflare-fix.png)

Once the bans were happening, I wanted better visibility into what was actually being caught. A tiny "IP banned" message is technically an alert, but it's not a particularly *useful* alert. So I wired Telegram into the flow and let the scaffold script do a bit more work before sending a message along.

```bash
JAIL_NAME=$1
IP_ADDRESS=$2
SECONDS=$3

GEO_DATA=$(curl -s "http://ip-api.com/json/$IP_ADDRESS?fields=status,country,city,isp,lat,lon")

WHOIS_LINK="https://whois.domaintools.com/$IP_ADDRESS"
MESSAGE=$(printf "Fail2ban Alert\n\nJail: [%s]\nIP: %s\nDuration: %s" "$JAIL_NAME" "$IP_ADDRESS" "$TIME")
```

That little bit of extra context goes a long way. Seeing the jail name, the ban duration, the rough location, and the ISP immediately makes the alert feel actionable instead of decorative. I don't need to ssh into the box and go digging every time Fail2Ban wakes up angry.

![sanitized telegram alert](/images/85/telegram-alert.png)

The most useful part of the whole exercise, though, was the tiny fix at the end. The Cloudflare ban path worked almost immediately. The unban path did not. Which is, unfortunately, a pretty classic ops experience. The automation looks great right up until the moment it needs to clean up after itself.

The missing piece turned out to be this:

```ini
[Init]
cfzone =
cftoken =
notes = Fail2Ban_<name>
```

That `notes` value gives the Cloudflare action a stable way to identify the records it created, which means it can actually reverse them later. Without it, I had a setup that could punish traffic but not reliably unwind its own work. With it, the whole thing became something I could leave running without wondering if I was building up a future mess for myself.

I think that's my favorite kind of infrastructure lesson: the one where the difference between "cool demo" and "usable system" is a single boring line of config.

### fin
Ok friends, I'm happy to say this is exactly the kind of thing I want to be writing here again: small, practical, public-safe writeups from real work. I'm still collecting these kinds of experiments in the learning-path repo, and now that the blog is dusted off, some of them will keep making their way over here too. As always, and til next time, have a great day.
