import subprocess
import os
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

dns_dict = {}
with open("dns_dict.json", "r") as file:
    dns_dict = json.load(file)

workers = dns_dict["workers"]
master = dns_dict["master"]

mysql_user = "root"
mysql_password = "root_password"
mysql_db = "sakila"

output_file = "db_benchmark_results.txt"

def prepare_sysbench(node):
    """Run sysbench prepare step to initialize the database for benchmarking"""
    logger.info(f"Preparing sysbench on {node}...")

    command = [
        "sudo", "sysbench", "/usr/share/sysbench/oltp_read_only.lua",
        f"--mysql-host={node}",
        "--mysql-port=3306",
        f"--mysql-db={mysql_db}",
        f"--mysql-user={mysql_user}",
        f"--mysql-password={mysql_password}",
        "prepare"
    ]

    try:
        subprocess.run(command, capture_output=True, text=True, check=True)
        logger.info(f"Prepare completed for {node}")
    except subprocess.CalledProcessError as e:
        logger.error(f"Error preparing sysbench on {node}: {e}")

def run_sysbench(node, is_master=False):
    """Run the sysbench benchmark on a given node"""
    logger.info(f"Running sysbench on {node}...")

    command = [
        "sudo", "sysbench", "/usr/share/sysbench/oltp_read_only.lua",
        f"--mysql-host={node}",
        "--mysql-port=3306",
        f"--mysql-db={mysql_db}",
        f"--mysql-user={mysql_user}",
        f"--mysql-password={mysql_password}",
        "run"
    ]

    try:
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        output = result.stdout

        with open(output_file, "a") as file:
            file.write(f"Benchmark results for {node} (Master: {is_master}):\n")
            file.write(output)
            file.write("\n" + "="*50 + "\n")
        
        logger.info(f"Benchmark completed for {node}")
    except subprocess.CalledProcessError as e:
        logger.error(f"Error running sysbench on {node}: {e}")
        with open(output_file, "a") as file:
            file.write(f"Error running sysbench on {node}: {e}\n")

def main():
    prepare_sysbench(master)
    run_sysbench(master, is_master=True)

    for worker in workers:
        prepare_sysbench(worker)
        run_sysbench(worker)

    logger.info(f"Benchmarking complete. Results saved to {output_file}")

if __name__ == "__main__":
    main()
