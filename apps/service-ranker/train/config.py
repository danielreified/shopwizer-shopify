# service-ranker/train/config.py
# Legacy config file that re-exports from central config
# TODO: Update all files to import from config.ranker_config directly

import os
import sys

# Add parent dir to path for config import
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config.ranker_config import INFRA_CONFIG, MODEL_CONFIG, PIPELINE_CONFIG

AWS_REGION = INFRA_CONFIG["AWS_REGION"]
ATHENA_DATABASE = INFRA_CONFIG["ATHENA"]["DATABASE"]
ATHENA_OUTPUT = INFRA_CONFIG["ATHENA"]["OUTPUT"]
S3_PROCESSED_BUCKET = INFRA_CONFIG["S3"]["PROCESSED_BUCKET"]
S3_TRAINING_PREFIX = INFRA_CONFIG["S3"]["TRAINING_PREFIX"]

MIN_SLATE_SIZE = PIPELINE_CONFIG["MIN_SLATE_SIZE"]
MAX_SLATE_SIZE = PIPELINE_CONFIG["MAX_SLATE_SIZE"]
NEGATIVE_SAMPLE_RATIO = PIPELINE_CONFIG["NEGATIVE_SAMPLE_RATIO"]

DEFAULT_FEATURES = MODEL_CONFIG["DEFAULT_FEATURES"]
MODEL_PATH = INFRA_CONFIG["MODEL_PATH"]
TRAINING_DATA_PATH = INFRA_CONFIG["TRAINING_DATA_PATH"]
