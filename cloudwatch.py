import asyncio
import logging
import time
import aiohttp
import boto3
from datetime import datetime, timedelta, timezone
import matplotlib.pyplot as plt
import json
import socket
import numpy as np
import pandas as pd
from matplotlib.patches import Patch

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

cloudwatch_client = boto3.client('cloudwatch', region_name = 'us-east-1')
ec2_client = boto3.client('ec2', region_name="us-east-1")

def resolve_dns_to_ip(dns_names):
    ip_addresses = []
    for dns_name in dns_names:
        try:
            ip = socket.gethostbyname(dns_name)
            ip_addresses.append(ip)
        except socket.gaierror:
            print(f"Error: Unable to resolve {dns_name}")
    return ip_addresses

def get_cloudwatch_infos(fig_name, start_time=datetime.now(timezone.utc), end_time=datetime.now(timezone.utc) - timedelta(minutes=10)):
    dns_dict = {}
    with open("./gatekeeper/dns_dict.json", "r") as file:
        dns_dict = json.load(file)

    workers = dns_dict["workers"]
    master = dns_dict["master"]
    
    dns_names = workers + [master]
    
    ips = resolve_dns_to_ip(dns_names)
    described_instances = ec2_client.describe_instances() 

    instances = []
    for reservation in described_instances['Reservations']:
        for instance in reservation['Instances']:
            instances.append(instance)

    ip_to_id = dict()
    for instance in instances:
        if instance['PublicIpAddress'] in ips:
            ip_to_id[instance['PublicIpAddress']] = instance['InstanceId']


    metric_data_queries = [
                {
                    'Id': 'i' + instance['InstanceId'][2:],
                    'MetricStat': {
                        'Metric': {
                            'Namespace': 'AWS/EC2',
                            'MetricName': 'CPUUtilization',
                            'Dimensions': [
                                {
                                    'Name': 'InstanceId',
                                    'Value': instance['InstanceId'],
                                }
                            ]
                        },
                        'Period': 300,
                        'Stat': 'Maximum',
                        'Unit': 'Percent'
                    },
                }
            for i, instance in enumerate(instances) if instance['PublicIpAddress'] in ips]
    
    response = cloudwatch_client.get_metric_data(
        MetricDataQueries = metric_data_queries,
        StartTime = end_time - timedelta(seconds=30),
        EndTime = end_time
    )
    print(response)
    role_mapping = {ip: f"Worker {i+1}" for i, ip in enumerate(ips[:-1])}
    role_mapping[ips[-1]] = "Master"

    x_labels = [role_mapping[ip] for ip in ips]
    y_values = [data_results['Values'][0] if data_results['Values'] else 0 for data_results in response['MetricDataResults']]
    legend_entries = [f"{role_mapping[ip]} -> {dns}" for dns, ip in zip(dns_names, ips)]

    s = pd.Series(y_values, index=x_labels)
    ax = s.plot(
        kind="bar",
        color=["tab:blue", "tab:green", "tab:orange"],  # Custom bar colors
        xlabel="Cluster Nodes",
        ylabel="Maximum CPU Utilization (%)",
        title="Maximum CPU Utilization of Each Cluster Node During Benchmarking",
        figsize=(12, 6),
    )


    legend_patches = [
        Patch(color=color, label=entry) 
        for color, entry in zip(["tab:blue", "tab:green", "tab:orange"], legend_entries)
    ]

    ax.legend(handles=legend_patches, loc="best", fontsize="small", bbox_to_anchor=(1.05, 1))

    plt.subplots_adjust(bottom=0.15)
    plt.subplots_adjust(left=0.15)
    plt.subplots_adjust(right=0.60) 

    plt.savefig(fig_name)


async def call_endpoint_http(session, request_num, url, method="GET", data=None):
    headers = {'content-type': 'application/json'}
    
    try:
        if method.upper() == "POST":
            async with session.post(url, headers=headers, json=data) as response:
                status_code = response.status
                response_json = await response.json()
                return status_code, response_json
        elif method.upper() == "GET":
            async with session.get(url, headers=headers) as response:
                status_code = response.status
                response_json = await response.json()
                return status_code, response_json
        else:
            logger.error(f"Request {request_num}: Unsupported HTTP method '{method}'")
            return None, f"Unsupported HTTP method '{method}'"
    except Exception as e:
        logger.error(f"Request {request_num}: Failed - {str(e)}")
        return None, str(e)


async def benchmark(gatekeeper_url):
    num_requests = 1000
    read_requests = ['customized', 'random', 'direct-hit']
    cloudwatch_info = {}
    
    for request in read_requests:
        start_time = datetime.now(timezone.utc)
        
        url = f"{gatekeeper_url}/{request}"
        logger.info(f"Starting benchmarking for read/{request}: {url} at {start_time}")

        async with aiohttp.ClientSession() as session:
            tasks = [call_endpoint_http(session, i, url) for i in range(num_requests)]
            await asyncio.gather(*tasks)

        end_time = datetime.now(timezone.utc)
        logger.info(f"Ending benchmarking for read/{request}: {url} at {end_time}")
        
        cloudwatch_info[request] = (start_time, end_time)
    
    # Write request
    
    start_time = datetime.now(timezone.utc)
    url = f"{gatekeeper_url}/"
    
    logger.info(f"Starting benchmarking for write: {url} at {start_time}")
    
    data = {
        "first_name": "ZINEB",
        "last_name": "YOUSSOUFI"
    }
    
    async with aiohttp.ClientSession() as session:
        tasks = [call_endpoint_http(session, i, url, "POST", data) for i in range(num_requests)]
        await asyncio.gather(*tasks)
    
    end_time = datetime.now(timezone.utc)
    logger.info(f"Ending benchmarking for write: {url} at {end_time}")
    cloudwatch_info["write"] = (start_time, end_time)
    
    logger.info("Waiting for 5 minutes before getting Cloudwatch metrics")
    time.sleep(300)
    for request, times in cloudwatch_info.items():
        get_cloudwatch_infos(f"{request}.png", times[0], times[1])

if __name__ == '__main__':
    dns_dict = {}
    with open("./gatekeeper/dns_dict.json", "r") as file:
        dns_dict = json.load(file)

    gatekeeper_dns = dns_dict['gatekeeper']
    asyncio.run(benchmark(f"http://{gatekeeper_dns}"))

    
    