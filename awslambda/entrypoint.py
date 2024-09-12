# Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance
# with the License. A copy of the License is located at
#
# http://aws.amazon.com/apache2.0/
#
# or in the "LICENSE.txt" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
# OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions and
# limitations under the License.
import os
import re
from os import environ
from typing import Any, Dict

import app
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)
from awslambda.serverless_wsgi import handle_request

# Initialize as a global to re-use across Lambda invocations
pcluster_manager_api = None  # pylint: disable=invalid-name

profile = environ.get("PROFILE", "prod")
is_dev_profile = profile == "dev"

if is_dev_profile:
    environ["FLASK_ENV"] = "development"
    environ["FLASK_DEBUG"] = "1"


def _init_flask_app(is_default_domain: bool):
    return app.run(is_default_domain)

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    try:
        logging.info(f"Processing {event} with {context}")
        host = event.get('headers', {}).get('Host', "")
        if not host:
            raise ValueError("Missing host header")
        is_default_domain = True if re.search("execute-api\..+\.amazonaws\.com", host) else False
        logging.info(f"Host: {host} is_default_domain: {is_default_domain}")

        global pcluster_manager_api  # pylint: disable=global-statement,invalid-name
        # if not pcluster_manager_api:
        logging.info("Initializing Flask Application")
        pcluster_manager_api = _init_flask_app(is_default_domain)
        # Setting default region to region where lambda function is executed
        os.environ["AWS_DEFAULT_REGION"] = os.environ["AWS_REGION"]
        return handle_request(pcluster_manager_api, event, context)
    except Exception as e:
        logging.critical("Unexpected exception: %s", e, exc_info=True)
        raise Exception("Unexpected fatal exception. Please look at API logs for details on the encountered failure.")
