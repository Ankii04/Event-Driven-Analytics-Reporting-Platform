# 🚀 GCP Deployment Guide: Analytics Core

Follow these steps to deploy your project to Google Cloud Platform (GCP) for free using your trial credits.

## 1. Create a VM Instance
1. Go to **Compute Engine** -> **VM Instances**.
2. Click **Create Instance**.
3. **Region**: Choose one close to you (e.g., `us-central1`).
4. **Machine Type**: Choose `e2-medium` (2 vCPU, 4GB RAM). This is covered by free credits and is powerful enough for Kafka + Elasticsearch.
5. **Boot Disk**: 
   - OS: **Ubuntu 22.04 LTS**
   - Size: **25 GB** (SSD preferred).
6. **Firewall**: Check both **Allow HTTP traffic** and **Allow HTTPS traffic**.
7. Click **Create**.

## 2. Setup Firewall Rules (CRITICAL)
Your services run on specific ports. You must open them in GCP:
1. Go to **VPC Network** -> **Firewall**.
2. Click **Create Firewall Rule**.
3. **Name**: `allow-analytics-ports`
4. **Targets**: `All instances in the network`
5. **Source IPv4 range**: `0.0.0.0/0`
6. **Protocols and ports**:
   - Select **Specified protocols and ports**.
   - Check **TCP** and enter: `3003, 3005, 4000`.
7. Click **Create**.

## 3. Prepare the Server
Once your VM is ready, click **SSH** to open the terminal and run:

```bash
# Update and install Docker
sudo apt update
sudo apt install -y docker.io docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Allow your user to run docker without sudo
sudo usermod -aG docker $USER
# (Now Logout and Login again to apply permissions, or use 'newgrp docker')
```

## 4. Deploy the Project
1. **Clone your code**:
   ```bash
   git clone <YOUR_GITHUB_REPO_URL>
   cd project
   ```

2. **Run Everything**:
   ```bash
   docker-compose up -d --build
   ```

## 5. Access the Dashboard
1. Find your **External IP** on the GCP VM Instance page.
2. Open your browser and go to: `http://<YOUR_EXTERNAL_IP>:3005`
3. **Everything will work instantly!** The dashboard will automatically detect the server's IP and connect to the API Gateway.

---

## 🛠️ Performance Tips for GCP
If the server feels slow (Kafka and Elasticsearch take a lot of RAM):
1. **Enable Swap**:
   ```bash
   sudo fallocate -l 4G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
2. This adds 4GB of "virtual RAM" which makes Kafka and Elasticsearch very stable.

## ✅ Done!
Your project is now live. Anyone with the IP address can see your professional real-time analytics engine!
