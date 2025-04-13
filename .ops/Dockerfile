FROM gitlab.com/utasksbot/dependency_proxy/containers/node:lts-slim as build
ARG NODE_ENV=development
WORKDIR /app/apps/utf
COPY ["apps/utf/package.json", "./"]
WORKDIR /app
COPY ["package.json", "package-lock.json", "./"]
RUN npm ci -ws
COPY . .
RUN npm run build-dev

FROM registry.gitlab.com/utasksbot/devops/nginx:5fa855c3
COPY --from=build /app/apps/utf/.output/public /usr/share/nginx/html
COPY --from=build /app/apps/utf/.output/public/_build/.vite/manifest.json /usr/share/nginx/html
