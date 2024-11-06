import subprocess
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def ssh(env, cmd, first_connection=False, capture_output=False):
    if (first_connection):
        subprocess.run(["ssh", "-o", "StrictHostKeyChecking=no", "-l", f"{env["user"]}", f"{env["host"]}"])

    logger.info(cmd)
    return subprocess.run(
        ["ssh", "-q", "-i", env["key_filename"], f"{env['user']}@{env['host']}", "-T", cmd],
        capture_output=capture_output,
        text=True
    )

def workers_init(instances_dns):
    # Get the DNS of each instances from the dictionary file
    # SSH into each instance and run the initialization script
    
    for instance in instances_dns:
        env = {
            "key_filename": 'project_pem_key.pem',
            "user": "ubuntu",
            "host": instance,
        }

        ssh(env, "sudo apt update -y", first_connection=True)
        ssh(env, "sudo apt-get install mysql-server -y")
        ssh(env, "wget -0 sakila-db.tar.gz https://downloads.mysql.com/docs/sakila-db.tar.gz")
        ssh(env, "tar -xvzf sakila-db.tar.gz")
        ssh(env, "rm sakila-db.tar.gz")
        ssh(env, "mysql -e 'SOURCE ./sakila-db/sakila-schema.sql;'")
        ssh(env, "mysql -E 'SOURCE ./sakila-db/sakila-data.sql;'")
        ssh(env, "mysql -e 'USE sakila'")
        ssh(env, "mysql -e mysql -e \"CREATE USER \'admin\'@\'localhost\' IDENTIFIED BY \'password\';\"")

        logger.info(f"Worker {instance} initialized")

if __name__ == "__main__":
    
    
    workers_init()