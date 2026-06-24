# syntax=docker/dockerfile:1

# Build OHIF from the upstream source repository, pinned to the v3.7 release.
# This follows the OHIF development flow: yarn install --frozen-lockfile,
# then yarn run build, and packages platform/app/dist behind nginx.

ARG OHIF_REPO=https://github.com/OHIF/Viewers.git
ARG OHIF_GIT_REF=v3.7.0

FROM node:18.16.1-slim AS source
ARG OHIF_REPO
ARG OHIF_GIT_REF

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates git \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src
RUN git clone --depth 1 --branch "${OHIF_GIT_REF}" "${OHIF_REPO}" app

FROM node:18.16.1-slim AS json-copier

RUN mkdir /usr/src/app
WORKDIR /usr/src/app

COPY --from=source /usr/src/app/package.json /usr/src/app/yarn.lock /usr/src/app/preinstall.js ./
COPY --from=source /usr/src/app/extensions /usr/src/app/extensions
COPY --from=source /usr/src/app/modes /usr/src/app/modes
COPY --from=source /usr/src/app/platform /usr/src/app/platform

FROM node:18.16.1-slim AS builder

RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential python3 \
  && rm -rf /var/lib/apt/lists/*

RUN mkdir /usr/src/app
WORKDIR /usr/src/app

COPY --from=json-copier /usr/src/app .

RUN yarn config set workspaces-experimental true
RUN yarn install --frozen-lockfile --verbose

COPY --from=source /usr/src/app .

RUN yarn install --frozen-lockfile --verbose

ENV PATH=/usr/src/app/node_modules/.bin:$PATH
ENV QUICK_BUILD=true

RUN yarn run build

FROM nginxinc/nginx-unprivileged:1.25-alpine AS final

ENV PORT=80

RUN rm /etc/nginx/conf.d/default.conf

USER nginx
COPY --chown=nginx:nginx --from=source /usr/src/app/.docker/Viewer-v3.x /usr/src
RUN chmod 777 /usr/src/entrypoint.sh

COPY --from=builder /usr/src/app/platform/app/dist /usr/share/nginx/html

USER root
RUN sed -i "s|https://[^\"']*polyfill\\.io[^\"']*|https://cdnjs.cloudflare.com/ajax/libs/polyfill/3.41.0/polyfill.min.js|g" /usr/share/nginx/html/index.html \
  && sed -i "/ohif-custom\\.css/d" /usr/share/nginx/html/index.html \
  && sed -i "/ohif-custom\\.js/d" /usr/share/nginx/html/index.html \
  && sed -i "s|</head>|<link rel=\"stylesheet\" href=\"/ohif-custom.css?v=mpacs-20260624-ohif370-source\"></head>|" /usr/share/nginx/html/index.html \
  && sed -i "s|</body>|<script src=\"/ohif-custom.js?v=mpacs-20260624-ohif370-source\"></script></body>|" /usr/share/nginx/html/index.html \
  && chmod 666 /usr/share/nginx/html/app-config.js

USER nginx

ENTRYPOINT ["/usr/src/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
