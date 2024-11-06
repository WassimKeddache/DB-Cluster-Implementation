#!/bin/bash

# git clone the repo
# download nodejs
# npm install
# npm run build
# npm run start

sudo apt-get update -y
sudo apt-get install mysql-server -y

wget -0 sakila-db.tar.gz https://downloads.mysql.com/docs/sakila-db.tar.gz
tar -xvzf sakila-db.tar.gz
rm sakila-db.tar.gz

mysql -e "SOURCE ./sakila-db/sakila-schema.sql;"
mysql -E "SOURCE ./sakila-db/sakila-data.sql;"

mysql -e "USE sakila"
mysql -e "CREATE USER \'admin\'@\'localhost\' IDENTIFIED BY \'password\';"
