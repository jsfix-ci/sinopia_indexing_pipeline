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
curl -i -X POST -H 'Content-Type: text/turtle; charset=UTF-8' -H 'Link: <http://www.w3.org/ns/ldp#BasicContainer>; rel="type"' -H "Slug: $(uuidgen)" -d "@prefix dcterms: <http://purl.org/dc/terms/> .\n@prefix ldp: <http://www.w3.org/ns/ldp#> .\n<> a ldp:Container, ldp:BasicContainer;\n dcterms:title 'A cool resource' ." http://platform:8080
```

Note that the above example assumes that your host has an alias from `platform` (the name of Trellis host running within docker-compose) to `localhost` (in e.g., `/etc/hosts`). If you use `localhost:8080` instead, the pipeline won't be able to retrieve the resource from Trellis.

## Development

For development purposes, you may wish to spin up all the components other than the pipeline if you'll be iterating:

```shell
$ docker-compose up -d platform search
```

And then spin up the pipeline using:

```shell
npm run dev-start
```

### Create a Trellis resource (dev)

See the same section under `Testing` above, but note that you won't need to create the `platform` alias when running in dev, so your `curl` command can hit `localhost:8080`.

## Build and push image

The CircleCI build is configured to perform these steps automatically on any successful build on the `master` branch. If you need to manually build and push an image, you can do this:

```shell
$ docker build -t ld4p/sinopia_indexing_pipeline .
$ docker push ld4p/sinopia_indexing_pipeline
```
