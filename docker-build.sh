#!/bin/bash

TAG_NAME="$(git rev-parse --short=12 HEAD)"
echo "TAG_NAME=$TAG_NAME"

# 이미지 빌드
docker build -t bosagora/lodestar:"$TAG_NAME" -f Dockerfile .

# 빌드된 이미지 푸시
docker push bosagora/lodestar:"$TAG_NAME"
