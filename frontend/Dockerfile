FROM node:lts-bookworm-slim AS frontend

ARG PROJECT
WORKDIR /app
RUN apt-get update
RUN apt-get install -y ca-certificates
COPY dist/$PROJECT/ /app/
CMD node server/server.mjs
EXPOSE 4000