sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

cd /home/ubuntu/


# Build the worker image
cd /home/ubuntu/db
sudo docker build -t db_node .
sudo docker save -o db_node.tar db_node
sudo chmod 644 db_node.tar


cd /home/ubuntu/gatekeeper

# Download docker
mkdir docker-packages
mv docker_installation.sh docker-packages
cd docker-packages
sudo chmod +x docker_installation.sh
sudo ./docker_installation.sh amd64 jammy

sudo apt-get install python3 -y

sudo apt-get install python3-pip -y

sudo apt-get install python3.12-venv -y

cd /home/ubuntu/gatekeeper
sudo chmod 400 ../project_pem_key.pem

python3 -m venv env

source env/bin/activate


python instances_init.py