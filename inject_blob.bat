@echo off
rem remove signature from exe
node src/unsignExe.mjs %1
rem inject blob into exe
node node_modules/postject/dist/cli.js %1 NODE_SEA_BLOB %2 --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2