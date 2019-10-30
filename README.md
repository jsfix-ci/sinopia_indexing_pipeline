[![CircleCI](https://circleci.com/gh/LD4P/sinopia_indexing_pipeline.svg?style=svg)](https://circleci.com/gh/LD4P/sinopia_indexing_pipeline)
[![Code Climate](https://codeclimate.com/github/LD4P/sinopia_indexing_pipeline/badges/gpa.svg)](https://codeclimate.com/github/LD4P/sinopia_indexing_pipeline)
[![Code Climate Test Coverage](https://codeclimate.com/github/LD4P/sinopia_indexing_pipeline/badges/coverage.svg)](https://codeclimate.com/github/LD4P/sinopia_indexing_pipeline/coverage)

# Sinopia Indexing Pipeline

This is the repository for the Sinopia Indexing Pipeline. The pipeline is a Node application that listens for messages (sent to a queue via STOMP), and for each message (a W3C Activity Streams message):

* Parses a subject URI out of the message. This URI corresponds to a Trellis resource that has been changed (add, edited, deleted).
* Dereferences the URI, asking for a JSON-LD representation.
* Indexes the JSON-LD, or a derivative thereof, in ElasticSearch.

The pipeline also includes a `bin/reindex` command that will wipe all ElasticSearch indices and reindex Trellis by crawling the tree of resources contained within Trellis.

**Note** that if the Trellis platform is running in a container, the reindexer will also need to run in a container, else it will fail to resolve Trellis's internal hostname. In that event, run `docker-compose run reindexer` instead.

## Testing

Using `docker-compose`, you can spin up containers for Trellis, ActiveMQ, ElasticSearch, Postgres, and the pipeline::

```shell
$ docker-compose up pipeline # add -d to run in background
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

To run the integration tests, they must be invoked independent of the unit tests:

```shell
$ npm run integration
```

**NOTE**: The `pipeline` `docker-compose` service must be running for the integration tests to pass.

### Continuous Integration

We are using CircleCI to run continuous integration. CircleCI invokes the integration tests using a container, which works around inter-container networking constraints in the CI environment. If you prefer to run integration tests in a manner that more closely matches what runs in CI, you can do that via:

```shell
$ docker-compose run integration
```

### Create a Trellis resource

To create a Trellis container and test integration between the pipeline components, you may do so using a curl incantation like follows:

```shell
$ curl -i -X POST -H 'Content-Type: application/ld+json' -H 'Link: <http://www.w3.org/ns/ldp#BasicContainer>; rel="type"' -H "Slug: repository" -d '{ "@context": { "dcterms": "http://purl.org/dc/terms/" }, "@id": "", "dcterms:title": "Repository container" }' http://localhost:8080
```

See [Sinopia Server notes](https://github.com/LD4P/sinopia_server/wiki/Draft-Notes-for-Sinopia-Server-API-Spec) for more Trellis `curl` incantations.

## Development

For development purposes, you may wish to spin up all the components other than the pipeline if you'll be iterating:

```shell
$ docker-compose up -d platform search searchui
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
