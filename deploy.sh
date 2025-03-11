#!/bin/bash
git checkout main && \
(git branch -D dist || true) && \
git checkout -b dist && \
cd landing && \
rm .gitignore && \
npm run build && \
cp CNAME dist/landing/browser/ || true && \
git add dist/landing/browser && \
git commit -m "Deploying landing browser files" && \
(git branch -D gh-pages || true) && \
cd / && \
git subtree split --prefix landing/dist/landing/browser -b gh-pages && \
git push -f origin gh-pages:gh-pages && \
git checkout main && \
git branch -D gh-pages && \
git branch -D dist && \
git checkout . 