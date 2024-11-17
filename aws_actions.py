import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import boto3
import time

ec2 = boto3.client("ec2", region_name="us-east-1")
ec2_resource = boto3.resource("ec2", region_name="us-east-1")

def create_pem_key():
    key_name = "project_pem_key"
    pem_file_path = f"{key_name}.pem"

    try:
        response = ec2.create_key_pair(KeyName=key_name)
        logging.info(f"pem key created: {response}")

        with open(pem_file_path, 'w') as file:
            file.write(response['KeyMaterial'])
    except Exception as e:
        logging.warning(f'The key {key_name} already exists.')

def create_instances(instance_type: str, number_of_instances: int, security_group_id: str, user_data: str = ""):
    try:
        logging.info(f"Creating {number_of_instances} {instance_type} instance(s)")
        instances = ec2.run_instances(
            ImageId="ami-0e86e20dae9224db8",  # Ubuntu image
            MinCount=number_of_instances,
            MaxCount=number_of_instances,
            KeyName="project_pem_key",
            InstanceType=instance_type,
            SecurityGroupIds=[security_group_id],
            UserData=user_data,
        )
        logging.info(f"Created {number_of_instances} {instance_type} instance(s)")
        return instances
    except Exception as e:
        logging.error(e)

def get_default_vpc_id() -> str:
    vpc_response = ec2.describe_vpcs(Filters = [
        {
            'Name': 'isDefault',
            'Values': ['true']
        }
    ])
    vpc_id = vpc_response['Vpcs'][0]['VpcId']
    logging.info(f'default VPC id: {vpc_id}')
    return vpc_id

def create_sg_internet_facing(vpc_id):
    security_group_id = ''
    try:
        response = ec2.create_security_group(
            GroupName='external-facing-sg',
            Description='Security group with open HTTP and SSH access',
            VpcId=vpc_id
        )
        
        security_group_id = response['GroupId']
        logging.info(f'Internet facing security Group created with ID: {security_group_id}')
        
        ec2.authorize_security_group_ingress(
            GroupId=security_group_id,
            IpPermissions=[
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 22,
                    'ToPort': 22,
                    'IpRanges': [{'CidrIp': '0.0.0.0/0'}]  # SSH depuis l'internet
                },
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 80,
                    'ToPort': 80,
                    'IpRanges': [{'CidrIp': '0.0.0.0/0'}]  # HTTP depuis l'internet
                }
            ]
        )
        logging.info('Ingress rules added for public SSH and HTTP access on internet-facing instance.')

        ec2.authorize_security_group_egress(
            GroupId=security_group_id,
            IpPermissions=[
                {
                    'IpProtocol': '-1',  # Allow all traffic
                    'FromPort': 0,
                    'ToPort': 65535,
                    'IpRanges': [{'CidrIp': '0.0.0.0/0'}]  # Allow all outbound
                }
            ]
        )
        logging.info('Egress rule added to allow all outbound traffic.')

    except Exception as e:
        logging.warning(f'An external facing security group already exists.')
        response = ec2.describe_security_groups(
            Filters=[
                {
                    'Name': 'group-name',
                    'Values': ['external-facing-sg']
                }
            ]
        )
        security_group_id = response['SecurityGroups'][0]['GroupId']
    logging.info(f"Security group ID: {security_group_id}")
    return security_group_id

def create_sg_internal(vpc_id, external_sg_id):
    internal_sg_id = ''
    try:
        response = ec2.create_security_group(
            GroupName='internal-facing-sg',
            Description='Security group with restricted HTTP and SSH access',
            VpcId=vpc_id
        )
        
        internal_sg_id = response['GroupId']
        
        ec2.authorize_security_group_ingress(
            GroupId=internal_sg_id,
            IpPermissions=[
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 22,
                    'ToPort': 22,
                    'UserIdGroupPairs': [
                        {
                        'Description': 'SSH access from other instances',
                        'GroupId': external_sg_id
                        }
                    ]
                },
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 80,
                    'ToPort': 80,
                    'UserIdGroupPairs': [
                        {
                        'Description': 'HTTP access from other instances',
                        'GroupId': external_sg_id
                        }
                    ]
                },
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 22,
                    'ToPort': 22,
                    'UserIdGroupPairs': [
                        {
                        'Description': 'SSH access from other instances',
                        'GroupId': internal_sg_id
                        }
                    ]
                },
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 80,
                    'ToPort': 80,
                    'UserIdGroupPairs': [
                        {
                        'Description': 'HTTP access from other instances',
                        'GroupId': internal_sg_id
                        }
                    ]
                },
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 3306,
                    'ToPort': 3306,
                    'UserIdGroupPairs': [
                        {
                            'Description': 'MySQL access from internal instances',
                            'GroupId': internal_sg_id
                        }
                    ]
                },
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 3306,
                    'ToPort': 3306,
                    'UserIdGroupPairs': [
                        {
                            'Description': 'MySQL access from external instances', # TODO A RETIRER QUAND ON AURA UN PROXY
                            'GroupId': external_sg_id
                        }
                    ]
                }
            ]
        )
        logging.info('Ingress rules added for SSH and HTTP between internal instances and the internet facing instances.')

        ec2.authorize_security_group_egress(
            GroupId=internal_sg_id,
            IpPermissions=[
                {
                    'IpProtocol': '-1',  # Allow all traffic
                    'FromPort': 0,
                    'ToPort': 65535,
                    'UserIdGroupPairs': [
                        {
                        'Description': 'HTTP access from other instances',
                        'GroupId': internal_sg_id
                        }
                    ] # Allow all outbound
                },
                {
                    'IpProtocol': '-1',  # Allow all traffic
                    'FromPort': 0,
                    'ToPort': 65535,
                    'UserIdGroupPairs': [
                        {
                        'Description': 'HTTP access from other instances',
                        'GroupId': external_sg_id
                        }
                    ]  # Allow all outbound
                }
            ]
        )
    except Exception as e:
        logging.warning(f'An internal security group already exists.')
        response = ec2.describe_security_groups(
            Filters=[
                {
                    'Name': 'group-name',
                    'Values': ['internal-facing-sg']
                }
            ]
        )
        internal_sg_id = response['SecurityGroups'][0]['GroupId']
    logging.info(f"Internal security group ID: {internal_sg_id}")
    return internal_sg_id



def create_security_groups(vpc_id):
    internet_facing_sg_id = create_sg_internet_facing(vpc_id)
    internal_sg_id = create_sg_internal(vpc_id, internet_facing_sg_id)
    return internet_facing_sg_id, internal_sg_id

def wait_for_instance(instance_id):
    instance_ressource = ec2_resource.Instance(instance_id)
    logging.info("Waiting until running")
    instance_ressource.wait_until_running()
    logging.info("Waiting 30s")
    time.sleep(30)

def get_dns_name(instance_id):
    # TODO Get the private DNS name of the instance
    new_instance_desc = ec2.describe_instances(InstanceIds = [instance_id]) 
    new_instance = new_instance_desc['Reservations'][0]['Instances'][0]
    return new_instance['PublicDnsName']