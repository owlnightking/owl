FROM myoung34/github-runner:latest

ENV RUNNER_NAME=owl-runner
ENV RUNNER_LABELS=self-hosted,linux,x64,owl,docker

USER root
RUN apt-get update && apt-get install -y docker.io && rm -rf /var/lib/apt/lists/*
USER runner

ENTRYPOINT ["/entrypoint.sh"]
