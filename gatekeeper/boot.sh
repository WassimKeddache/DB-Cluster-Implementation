sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

cd /home/ubuntu/


# Build the worker image
cd /home/ubuntu/db_worker
sudo docker build -t worker .
sudo docker save -o worker.tar worker
sudo chmod 644 worker.tar


cd /home/ubuntu/gatekeeper

mkdir docker-packages
cd docker-packages
sudo chmod +x docker_installation.sh
sudo ./script.sh amd64 jammy

sudo apt-get install python3 -y

sudo apt-get install python3-pip -y

sudo apt-get install python3.12-venv -y

sudo chmod 400 ../project_pem_key.pem

python3 -m venv env

source env/bin/activate


python instances_init.py