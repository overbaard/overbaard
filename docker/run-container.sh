#! /bin/bash

SCRIPT_DIR="$(dirname $0)"
echo $SCRIPT_DIR
SCRIPT_DIR=$(realpath "${SCRIPT_DIR}")  

MVN_CACHE_DIR="${SCRIPT_DIR}/maven-repo-cache"
SOURCE_ROOT_DIR="${SCRIPT_DIR}/.."

docker run --rm -it \
  --name overbaard-dev \
  -v "${MVN_CACHE_DIR}":"/root/.m2/repository" \
  -v "${SOURCE_ROOT_DIR}":/source \
  -p 8080:8080 \
  -p 2990:2990 \
  -p 5005:5005 \
  -p 4200:4200 \
  -p 9876:9876 \
  quay.io/overbaard/overbaard-dev-env bash
