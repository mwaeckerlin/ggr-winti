FROM mwaeckerlin/latex AS latex

FROM mwaeckerlin/nodejs-build AS modules
COPY --chown=${BUILD_USER} package.json package-lock.json ./
COPY --chown=${BUILD_USER} src/lib/package.json ./src/lib/
COPY --chown=${BUILD_USER} src/app/package.json ./src/app/
COPY --chown=${BUILD_USER} src/srv/package.json ./src/srv/
RUN NODE_ENV=production npm install

FROM mwaeckerlin/nodejs-build AS build
COPY --chown=${BUILD_USER} . .
RUN NODE_ENV=development npm install
RUN NODE_ENV=production npm run build
RUN mkdir -p /tmp/ggr-winti/vorstoss-pdf

FROM mwaeckerlin/nodejs AS production
EXPOSE 3000
COPY --from=latex / /
COPY --from=modules /app/node_modules node_modules
COPY --from=build --chown=${RUN_USER} /tmp/ggr-winti /tmp/ggr-winti
COPY --from=build /app/src/lib/dist /app/src/lib
COPY --from=build /app/src/srv/dist/ dist
COPY --from=build /app/src/app/dist/ dist/app
COPY --from=build /app/tex tex
ENV TEX_CLASS_PATH /app/tex
CMD ["/usr/bin/node", "/app/dist/main"]
