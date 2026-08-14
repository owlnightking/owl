FROM rancher/rancher:latest

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    bash git curl jq docker.io sudo \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash runner && \
    echo "runner ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

WORKDIR /runner

RUN curl -L -o runner.tar.gz https://ghfast.top/https://github.com/actions/runner/releases/download/v2.328.0/actions-runner-linux-x64-2.328.0.tar.gz && \
    tar xzf runner.tar.gz && \
    rm runner.tar.gz && \
    chown -R runner:runner /runner

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER runner

ENTRYPOINT ["/entrypoint.sh"]
