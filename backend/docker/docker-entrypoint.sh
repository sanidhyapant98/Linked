#!/bin/sh
# K8s-friendly entrypoint.
# - Uses `exec` so node is PID 1 and receives SIGTERM/SIGINT directly.
# - Migrations run ONLY when RUN_MIGRATIONS=true.
#   - docker-compose (single replica, local dev): set RUN_MIGRATIONS=true.
#   - Kubernetes: keep RUN_MIGRATIONS=false on the Deployment and run
#     migrations from an initContainer (same image):
#       initContainers:
#       - name: migrate
#         image: <backend-image>
#         command: ["npx", "prisma", "migrate", "deploy"]
#         envFrom: [{ secretRef: { name: backend-env } }]
#     This avoids N replicas racing `migrate deploy` on rollout.
set -eu

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
  echo "RUN_MIGRATIONS=true — running: npx prisma migrate deploy"
  npx prisma migrate deploy
else
  echo "RUN_MIGRATIONS!=true — skipping migrations (expect initContainer/job to handle them)"
fi

exec node dist/index.js
