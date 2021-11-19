nvm use v10.23.2
yarn
yarn run build:deps
cd packages/app
yarn run build:sandpack-sandbox

cp -rf ../../www/static/* ./www/static
cp -rf ../../www/public/* ./www/public
cp ../../www/apple-touch-icon-152x152.png ./www
cp ../../www/manifest.json ./www
rm -rf /Users/songmeinuo/Documents/code/public/sandpack-sandbox/*
cp -r www/* /Users/songmeinuo/Documents/code/public/sandpack-sandbox/

rm -rf /Users/songmeinuo/Documents/code/server/express-demo3/public/sandpack/
cp -r www/* /Users/songmeinuo/Documents/code/server/express-demo3/public/sandpack/
