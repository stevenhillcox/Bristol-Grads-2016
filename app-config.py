#!/usr/bin/python

import os
 
strToSearch="process.env.TWEET_WALL_OAUTH_SECRET"
strToReplace=os.environ['TWEET_WALL_OAUTH_SECRET']

echo strToReplace
 
fp=open("/server.js","r")
buffer=fp.read()
fp.close()
 
fp=open("/server.js","w")
fp.write(buffer.replace(strToSearch,strToReplace))
fp.close()

strToSearch="process.env.TWITTER_CONSUMER_KEY"
strToReplace=os.environ['TWITTER_CONSUMER_KEY']
 
fp=open("/server.js","r")
buffer=fp.read()
fp.close()
 
fp=open("/server.js","w")
fp.write(buffer.replace(strToSearch,strToReplace))
fp.close()

strToSearch="process.env.TWITTER_CONSUMER_SECRET"
strToReplace=os.environ['TWITTER_CONSUMER_SECRET']
 
echo strToReplace
 
fp=open("/server.js","r")
buffer=fp.read()
fp.close()
 
fp=open("/server.js","w")
fp.write(buffer.replace(strToSearch,strToReplace))
fp.close()


strToSearch="process.env.TWITTER_ACCESS_TOKEN_KEY"
strToReplace=os.environ['TWITTER_ACCESS_TOKEN_KEY']
 
fp=open("/server.js","r")
buffer=fp.read()
fp.close()
 
fp=open("/server.js","w")
fp.write(buffer.replace(strToSearch,strToReplace))
fp.close()

strToSearch="process.env.TWITTER_ACCESS_TOKEN_SECRET"
strToReplace=os.environ['TWITTER_ACCESS_TOKEN_SECRET']
 
fp=open("/server.js","r")
buffer=fp.read()
fp.close()
 
fp=open("/server.js","w")
fp.write(buffer.replace(strToSearch,strToReplace))
fp.close()

