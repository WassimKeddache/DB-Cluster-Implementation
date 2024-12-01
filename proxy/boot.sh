cd /home/ubuntu/docker-packages/

sudo dpkg -i ./containerd.io_1.7.24-1_amd64.deb
sudo dpkg -i ./docker-buildx-plugin_0.17.1-1~ubuntu.22.04~jammy_amd64.deb
sudo dpkg -i ./docker-ce-cli_27.3.1-1~ubuntu.22.04~jammy_amd64.deb
sudo dpkg -i ./docker-ce_27.3.1-1~ubuntu.22.04~jammy_amd64.deb
sudo dpkg -i ./docker-compose-plugin_2.29.7-1~ubuntu.22.04~jammy_amd64.deb

sudo apt-get install -f

sudo docker --version

cd /home/ubuntu/proxy

sudo docker load -i proxy.tar

sudo docker run -d -p 80:80 --name proxy proxy
