#!/bin/bash

# Define an array of Redis port numbers
ports=(7000 7001 7002 7003 7004 7005)

# Loop through the array and start Redis servers
for port in "${ports[@]}"; do
  cd "$port"
  redis-server ./redis.conf
  cd ..
done
