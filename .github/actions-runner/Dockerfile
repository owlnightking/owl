FROM ghcr.io/actions/actions-runner:latest

USER root

RUN apt-get update && apt-get install -y \
    docker.io sudo \
    && rm -rf /var/lib/apt/lists/*

RUN usermod -aG docker runner && \
    echo "runner ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER runner
