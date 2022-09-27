#!/bin/bash

DEPLOY_SERVER=$DEPLOY_SERVER

# Building React output
yarn install
yarn build:web

echo "Deploying to ${DEPLOY_SERVER}"
#sudo cp -R dist/* /var/www/pristorage.mymerchize.com/html/

echo "Finished copying the build files"