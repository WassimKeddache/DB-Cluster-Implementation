import aws_actions as aws
import logging



if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    logger.info("Creating pem key")
    aws.create_pem_key()
    
    logger.info("Creating security group")
    vpc_id = aws.get_default_vpc_id()
    
    internet_facing_sg_id, internal_sg_id = aws.create_security_groups(vpc_id)
    
    logger.info("Creating MySQL cluster workers")
    instances = aws.create_instances("t2.micro", 2, internal_sg_id)
    
    logger.info("Creating MySQL cluster master")
    instances = aws.create_instances("t2.micro", 1, internal_sg_id)
    
    logger.info("Creating Proxy")
    instances = aws.create_instances("t2.large", 1, internal_sg_id)
    
    logger.info("Creating Trusted Host")
    instances = aws.create_instances("t2.large", 1, internal_sg_id)
    
    # Map the DNS of each instances with dictionary
    # Write the dictionary to a file
    
    logger.info("Creating Gatekeeper")
    instances = aws.create_instances("t2.large", 1, internet_facing_sg_id)
    # Send DNS dictionary to Gatekeeper
    # Send initalization scripts to Gatekeeper, for [Proxy, Trusted Host, MySQL Master, MySQL Workers]
    
    
    