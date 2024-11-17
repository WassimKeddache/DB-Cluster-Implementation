import subprocess
import os
import logging
import json

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

def scp(env, file, is_dir=False):
    logger.info(f"Copying {env["user"]} to {env["host"]}")
    os.system(f"scp -i {env['key_filename']} {'-r' if is_dir else ''} {file} {env['user']}@{env['host']}:/home/{env['user']}/")

def workers_init(instances_dns):
    for instance in instances_dns:
        env = {
            "key_filename": '../project_pem_key.pem',
            "user": "ubuntu",
            "host": instance,
        }

        ssh(env, "echo 'Hello, World!'", first_connection=True)
        scp(env, "../db", is_dir=True)
        scp(env, "./docker-packages", is_dir=True)
        scp(env, "./dns_dict.json")
        ssh(env, "cd db && chmod +x boot.sh && ./boot.sh")

        logger.info(f"Worker {instance} initialized")

if __name__ == "__main__":
    dns_dict = {}
    
    with open("dns_dict.json", "r") as file:
        dns_dict = json.load(file)
    
    workers_init(dns_dict["workers"])