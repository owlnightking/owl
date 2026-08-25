FROM ghcr.io/actions/actions-runner:latest

USER root

RUN apt-get update && apt-get install -y \
    docker.io sudo jq \
    && rm -rf /var/lib/apt/lists/*

RUN usermod -aG docker runner && \
    chown -R runner:runner /home/runner && \
    echo "runner ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER runner

ENTRYPOINT ["/entrypoint.sh"]
