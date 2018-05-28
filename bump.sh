#!/bin/bash
git add .
git commit -a -m 'fix'
npm version patch
git add .
git commit -a -m 'bump'
git push origin master
npm publish
