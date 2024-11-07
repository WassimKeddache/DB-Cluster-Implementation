import subprocess
import logging
import os

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