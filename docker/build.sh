#! /bin/bash

docker buildx build --push --platform linux/arm64,linux/amd64  --tag quay.io/overbaard/overbaard-dev-env:latest .