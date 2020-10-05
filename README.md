[![CircleCI](https://circleci.com/gh/LD4P/sinopia_indexing_pipeline.svg?style=svg)](https://circleci.com/gh/LD4P/sinopia_indexing_pipeline)
[![Code Climate](https://codeclimate.com/github/LD4P/sinopia_indexing_pipeline/badges/gpa.svg)](https://codeclimate.com/github/LD4P/sinopia_indexing_pipeline)
[![Code Climate Test Coverage](https://codeclimate.com/github/LD4P/sinopia_indexing_pipeline/badges/coverage.svg)](https://codeclimate.com/github/LD4P/sinopia_indexing_pipeline/coverage)

# Sinopia Indexing Pipeline

This is the repository for the Sinopia Indexing Pipeline. The pipeline is a Node application that
responds to a MongoDB [Change Streams](https://docs.mongodb.com/manual/changeStreams/) and
indexes parts of the document into Elasticsearch:

* Extracts the JSON-LD representation from the `data` property in the MongoDB document
* Indexes the JSON-LD, or a derivative thereof, in ElasticSearch.

The pipeline also includes a `bin/reindex` command that will wipe all ElasticSearch indices and reindex by crawling MongoDB.


## Testing

Using `docker-compose`, you can spin up containers for MongoDB, ElasticSearch, and
the pipeline:

```shell
$ docker-compose up pipeline # add -d to run in background
```

You should also run the MongoDB setup to create the collections and load the
supporting files for resource templates:

```shell
$ docker-compose run mongo-setup
```

To shut it down and clean up, run:

```shell
$ docker-compose down
```

### Run the linter and tests

```shell
$ npm run ci
```

Or, to run the linter and unit tests separately:

```shell
$ npm run lint
$ npm test
```

## Development

For development purposes, you may wish to spin up all the components other than the
pipeline:

```shell
$ docker-compose up -d mongo search searchui
```

And then spin up the pipeline using:

```shell
$ npm run dev-start
```

Note that if you want to view the ElasticSearch index, you can browse to http://localhost:1358/.

## Build and push image

The CircleCI build is configured to perform these steps automatically on any successful build on the `master` branch. If you need to manually build and push an image, you can do this:

```shell
$ docker build -t ld4p/sinopia_indexing_pipeline .
$ docker push ld4p/sinopia_indexing_pipeline
```
