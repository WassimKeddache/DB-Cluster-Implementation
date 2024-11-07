sudo apt-get install python3 -y

sudo apt-get install python3-pip -y

sudo apt-get install python3.12-venv -y

cd /home/ubuntu/gatekeeper

sudo chmod 400 ../project_pem_key.pem

python3 -m venv env

source env/bin/activate

python instances_init.py