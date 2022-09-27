#!/bin/bash

DEPLOY_SERVER=$DEPLOY_SERVER
SERVER_FOLDER="pristorage.mymerchize.com"

# Building React output
yarn install
yarn build:web

echo "Deploying to ${DEPLOY_SERVER}"
scp -r dist/* ubuntu@${DEPLOY_SERVER}:/var/www/${SERVER_FOLDER}/html/

echo "Finished copying the build files"