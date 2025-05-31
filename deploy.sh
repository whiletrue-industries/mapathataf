#!/bin/bash
git checkout main && \
(git branch -D dist || true) && \
git checkout -b dist && \
cd frontend && \
rm .gitignore && \
npm run build:landing && \
npm run build:app && \
npm run build:admin && \
mkdir _dist && \
cp CNAME _dist || true && \
mv dist/landing/browser/* _dist/ && \
mv dist/app/browser _dist/a/ && \
mv dist/admin/browser _dist/manage/ && \
git add _dist && \
git commit -m "Deploying frontend browser files" && \
(git branch -D gh-pages || true) && \
cd .. && \
git subtree split --prefix frontend/_dist -b gh-pages && \
git push -f origin gh-pages:gh-pages && \
git checkout main && \
git branch -D gh-pages && \
git branch -D dist && \
git checkout . 