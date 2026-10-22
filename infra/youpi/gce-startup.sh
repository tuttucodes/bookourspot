#!/bin/bash
set -euxo pipefail

exec > >(tee -a /var/log/youpi-bootstrap.log | logger -t youpi-bootstrap -s 2>/dev/console) 2>&1

if [ -f /var/lib/youpi-bootstrap-ready ]; then
  exit 0
fi

apt-get update
apt-get install -y ca-certificates curl git gnupg lsb-release
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \"${UBUNTU_CODENAME:-$VERSION_CODENAME}\") stable" > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl enable --now docker

# Small persistent boot disk with swap for the YouPI multi-service image build.
if [ ! -e /swapfile ]; then
  fallocate -l 3G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
fi
grep -q '^/swapfile ' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
swapon /swapfile || true

if [ ! -d /opt/youpi/.git ]; then
  rm -rf /opt/youpi
  git clone https://github.com/youpi-pg/YouPI-PG.git /opt/youpi
fi
git -C /opt/youpi fetch --depth=1 origin 3a35c98bdc39b45f9c0197c5ff7bb60a15a2d8c2
git -C /opt/youpi checkout --detach 3a35c98bdc39b45f9c0197c5ff7bb60a15a2d8c2

# Only Caddy may serve public traffic; admin/observer ports remain loopback-only.
sed -i '/"6100:6100"/d; /"7000:7000"/d; /"5000:5000"/d' /opt/youpi/docker-compose.yml
mkdir -p /opt/youpi/infra/youpi
cat > /opt/youpi/infra/youpi/Caddyfile <<'CADDY'
payments.bookourspot.com {
  encode zstd gzip
  reverse_proxy gateway:7000
}
CADDY
cat > /opt/youpi/docker-compose.override.yml <<'COMPOSE'
services:
  gateway:
    environment:
      YOUPI_MODE: production
      YOUPI_ALLOW_LOCALHOST_MODE: "false"
      CLOUDFLARE_DOMAIN: bookourspot.com
      DEPLOYMENT_PREFIX: payments
      BASE_PAYMENT_API_URL: http://localhost:6100
      BASE_CHECKOUT_URL: https://payments.bookourspot.com
      CHECKOUT_FRAME_ANCESTORS: https://bookourspot.com https://www.bookourspot.com
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "443:443/udp"
    volumes:
      - ./infra/youpi/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      gateway:
        condition: service_healthy

volumes:
  caddy_data:
  caddy_config:
COMPOSE
chmod 0644 /opt/youpi/infra/youpi/Caddyfile /opt/youpi/docker-compose.override.yml

touch /var/lib/youpi-bootstrap-ready
