FROM node:8

WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend frontend
RUN yarn run build

FROM ruby:2.5-alpine

ENV APP_ENV=production
RUN apk --no-cache add build-base libffi-dev
RUN bundle config --global frozen 1
WORKDIR /usr/src/app
COPY Gemfile Gemfile.lock ./
RUN bundle install
COPY . .
RUN rm -rf frontend package.json yarn.lock
COPY --from=0 /usr/src/app/dist dist

CMD ["ruby", "server.rb"]
