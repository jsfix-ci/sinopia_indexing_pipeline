[![CircleCI](https://circleci.com/gh/LD4P/sinopia_indexing_pipeline.svg?style=svg)](https://circleci.com/gh/LD4P/sinopia_indexing_pipeline)

# Sinopia Indexing Pipeline

This is the repository for the Sinopia Indexing Pipeline. The pipeline is a Node application that listens for messages (sent to a queue via STOMP), and for each message (a W3C Activity Streams message):

* Parses a subject URI out of the message. This URI corresponds to a Trellis resource that has been changed (add, edited, deleted).
* Dereferences the URI, asking for a JSON-LD representation.
* Indexes the JSON-LD, or a derivative thereof, in ElasticSearch.

## Local Development Set up

### With Docker & Docker-Compose

Using `docker-compose`, you can spin up containers for Trellis, ActiveMQ, ElasticSearch, and the pipeline::

```
$ docker-compose up -d
```

To shut it down and clean up, run:

```
$ docker-compose down
```
