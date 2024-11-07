# Start with an Ubuntu base image
FROM ubuntu:20.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y \
    mysql-server \
    wget \
    curl \
    unzip \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

RUN curl -LO https://downloads.mysql.com/docs/sakila-db.tar.gz && \
    tar -xvzf sakila-db.tar.gz && \
    cd sakila-db && \
    mysql -u root -e "CREATE DATABASE sakila;" && \
    mysql -u root sakila < sakila-schema.sql && \
    mysql -u root sakila < sakila-data.sql && \
    rm -rf sakila-db sakila-db.tar.gz

COPY package.json /app/package.json
WORKDIR /app
RUN npm install

COPY index.js /app/index.js

EXPOSE 3306
EXPOSE 8080

RUN sed -i "s/^bind-address.*$/bind-address = 0.0.0.0/" /etc/mysql/mysql.conf.d/mysqld.cnf

CMD service mysql start && node /app/index.js
