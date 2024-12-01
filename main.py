import aws_actions as aws
import logging
import ssh_interface as ssh
import os
import json
# TODO 

# Tester le script de cloudwatch
# Mettre les bons format de vm

def execute():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    logger.info("Creating pem key")
    aws.create_pem_key()
        
    logger.info("Creating security group")
    vpc_id = aws.get_default_vpc_id()
        
    internet_facing_sg_id, internal_sg_id = aws.create_security_groups(vpc_id)

    dns_dict = {}

    logger.info("Creating Gatekeeper")
    response = aws.create_instances("t2.large", 1, internet_facing_sg_id) 
    gatekeeper_instance = response["Instances"][0]["InstanceId"]
    aws.wait_for_instance(gatekeeper_instance)
    dns_dict['gatekeeper'] = aws.get_dns_name(gatekeeper_instance)
    logger.info("Gatekeeper created")
    
    logger.info("Creating MySQL cluster workers")
    response = aws.create_instances("t2.micro", 2, internal_sg_id)
    aws.wait_for_instance(response["Instances"][0]["InstanceId"])
    dns_worker = aws.get_dns_name(response["Instances"][0]["InstanceId"])
    dns_dict['workers'] = [dns_worker]
    dns_worker = aws.get_dns_name(response["Instances"][1]["InstanceId"])
    dns_dict['workers'].append(dns_worker)
    logger.info("Workers created", dns_dict)
    
    logger.info("Creating MySQL cluster master")
    response = aws.create_instances("t2.micro", 1, internal_sg_id)
    aws.wait_for_instance(response["Instances"][0]["InstanceId"])
    dns_master = aws.get_dns_name(response["Instances"][0]["InstanceId"])
    dns_dict['master'] = dns_master
    
    logger.info("Creating Proxy")
    response = aws.create_instances("t2.large", 1, internal_sg_id)
    aws.wait_for_instance(response["Instances"][0]["InstanceId"])
    dns_proxy = aws.get_dns_name(response["Instances"][0]["InstanceId"])
    dns_dict['proxy'] = dns_proxy
    logger.info("Proxy created")
    
    logger.info("Creating Trusted Host")
    response = aws.create_instances("t2.large", 1, internal_sg_id)
    aws.wait_for_instance(response["Instances"][0]["InstanceId"])
    dns_trusted_host = aws.get_dns_name(response["Instances"][0]["InstanceId"])
    dns_dict['trusted_host'] = dns_trusted_host
    logger.info("Trusted Host created")
    

    with open('./gatekeeper/dns_dict.json', 'w') as file:
        json.dump(dns_dict, file, indent=4)
    
    
    gatekeeper_instance_dns = aws.get_dns_name(gatekeeper_instance)

    env = {
            "key_filename": 'project_pem_key.pem',
            "user": "ubuntu",
            "host": gatekeeper_instance_dns,
        }
    
    ssh.ssh(env, "sudo apt-get update -y && sudo apt-get install dos2unix", first_connection=True)
    ssh.scp(env, "project_pem_key.pem")
    ssh.scp(env, "./gatekeeper", True)
    ssh.scp(env, "./db", True)
    ssh.scp(env, "./proxy", True)
    ssh.scp(env, "./trusted_host", True)
    ssh.ssh(env, "cd gatekeeper && chmod +x boot.sh && dos2unix boot.sh && ./boot.sh")
    
    os.system(f"scp -i ./project_pem_key.pem ubuntu@{env['host']}:/home/ubuntu/gatekeeper/db_benchmark_results.txt ./benchmarks/db_benchmark_results.txt")
    
    
    
if __name__ == "__main__":
    execute()