#!/bin/bash

set -e

echo "========Starting deployment process========"

# start ssh-agent
eval $(ssh-agent -s)

# Add the SSH key to the ssh-agent
ssh-add ~/.ssh/jetei_dev_github
ssh -T git@github.com

echo "========Pulling new API changes========"

# download new version of our application
cd /home/ubuntu/jetei-dev
git pull git@github.com:Daniel-Brai/Jetei.git

# install all the dependencies
echo "========Installing dependencies========"
pnpm install

# perform migrations
echo "========Sync database========"
pnpm run prisma:migrate

# build the application
echo "========Building the application========"
pnpm run build:css && pnpm run build

# run the application
echo "=====Starting the application========="
cd ~
pm2 restart jetei --watch && pm2 save --force

echo "✨ Deployment process completed"