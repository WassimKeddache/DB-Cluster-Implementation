import aws_actions as aws
import logging
import ssh_interface as ssh
import os
import json
# TODO 
# Tester l'image docker dans gateway sans lancer db_worker
# Si image compile, tester index.js
# Si index.js compile, tester mysql


def test():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    logger.info("Creating pem key")
    aws.create_pem_key()
        
    logger.info("Creating security group")
    vpc_id = aws.get_default_vpc_id()
        
    internet_facing_sg_id, internal_sg_id = aws.create_security_groups(vpc_id)

    dns_dict = {}

    logger.info("Creating Gatekeeper")
    response = aws.create_instances("t2.micro", 1, internet_facing_sg_id)
    gatekeeper_instance = response["Instances"][0]["InstanceId"]
    aws.wait_for_instance(gatekeeper_instance)
    logger.info("Gatekeeper created")
    
    logger.info("Creating MySQL cluster workers")
    response = aws.create_instances("t2.micro", 1, internal_sg_id)
    aws.wait_for_instance(response["Instances"][0]["InstanceId"])
    dns_worker = aws.get_dns_name(response["Instances"][0]["InstanceId"])
    dns_dict['workers'] = [dns_worker]
    logger.info("Worker created")

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
    ssh.scp(env, "./db_worker", True)
    ssh.ssh(env, "cd gatekeeper && chmod +x boot.sh && dos2unix boot.sh && ./boot.sh")
    
if __name__ == "__main__":
    test()
    # aws.wait_for_instance("i-0018c877311b568af")
    # env = {
    #     "key_filename": 'project_pem_key.pem',
    #     "user": "ubuntu",
    #     "host": "ec2-54-209-251-144.compute-1.amazonaws.com"
    #     }
    # ssh.scp(env, "./db_worker", True)
    
    