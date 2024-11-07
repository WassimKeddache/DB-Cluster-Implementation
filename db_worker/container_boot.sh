#!/bin/bash

# Start MySQL service in the background
service mysql start

# Wait for MySQL to fully start
sleep 10

# Create the Sakila database and load the schema and data
mysql -u root -e "CREATE DATABASE IF NOT EXISTS sakila;"
mysql -u root sakila < /app/sakila-schema.sql
mysql -u root sakila < /app/sakila-data.sql

# Start the Node.js app
node /app/index.js