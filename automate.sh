#!/bin/bash
echo | sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt-get update
sudo apt-get install python3.12 -y
sudo apt-get install python3.12-venv -y
sudo apt-get install python3.12-distutils -y


python3.12 -m venv myenv
source myenv/bin/activate

echo "Installing dependencies..."

pip install --upgrade pip
pip install -r requirements.txt

echo "Running script ..."
python main.py

deactivate