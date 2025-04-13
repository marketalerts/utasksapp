# Kostya, ne trogai pozhaluysta!!!

FROM node:lts-slim as build
WORKDIR /app
COPY . .

FROM nginx:alpine
COPY --from=build /app/apps/utf/.output/public /usr/share/nginx/html
COPY --from=build /app/apps/utf/.output/public/_build/.vite/manifest.json /usr/share/nginx/html