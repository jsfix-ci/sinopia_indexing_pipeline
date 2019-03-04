[![CircleCI](https://circleci.com/gh/LD4P/sinopia_indexing_pipeline.svg?style=svg)](https://circleci.com/gh/LD4P/sinopia_indexing_pipeline)
[![Code Climate](https://codeclimate.com/github/LD4P/sinopia_indexing_pipeline/badges/gpa.svg)](https://codeclimate.com/github/LD4P/sinopia_indexing_pipeline)
[![Code Climate Test Coverage](https://codeclimate.com/github/LD4P/sinopia_indexing_pipeline/badges/coverage.svg)](https://codeclimate.com/github/LD4P/sinopia_indexing_pipeline/coverage)

# Sinopia Indexing Pipeline

This is the repository for the Sinopia Indexing Pipeline. The pipeline is a Node application that listens for messages (sent to a queue via STOMP), and for each message (a W3C Activity Streams message):

* Parses a subject URI out of the message. This URI corresponds to a Trellis resource that has been changed (add, edited, deleted).
* Dereferences the URI, asking for a JSON-LD representation.
* Indexes the JSON-LD, or a derivative thereof, in ElasticSearch.

## Testing

Using `docker-compose`, you can spin up containers for Trellis, ActiveMQ, ElasticSearch, Postgres, and the pipeline::

```shell
$ docker-compose up -d
```

To shut it down and clean up, run:

```shell
$ docker-compose down
```

### Create a Trellis resource (test)

To create a Trellis resource and test integration between the pipeline components, you may do so using a curl incantation like follows:

```shell
curl -i -X POST -H 'Content-Type: text/turtle; charset=UTF-8' -H 'Link: <http://www.w3.org/ns/ldp#BasicContainer>; rel="type"' -H "Slug: $(uuidgen)" -d "@prefix dcterms: <http://purl.org/dc/terms/> .\n@prefix ldp: <http://www.w3.org/ns/ldp#> .\n<> a ldp:Container, ldp:BasicContainer;\n dcterms:title 'A cool resource' ." http://localhost:8080
```

## Development

For development purposes, you may wish to spin up all the components other than the pipeline if you'll be iterating:

```shell
$ docker-compose up -d platform search searchui
```

And then spin up the pipeline using:

```shell
npm run dev-start
```

Note that if you want to view the ElasticSearch index, you can browse to http://localhost:1358/.

## Build and push image

The CircleCI build is configured to perform these steps automatically on any successful build on the `master` branch. If you need to manually build and push an image, you can do this:

```shell
$ docker build -t ld4p/sinopia_indexing_pipeline .
$ docker push ld4p/sinopia_indexing_pipeline
```
