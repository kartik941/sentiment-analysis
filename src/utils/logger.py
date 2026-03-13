"""src/utils/logger.py — Shared logger config for all modules."""
from loguru import logger
import sys

logger.remove()
logger.add(sys.stderr, level="INFO", format="{time:HH:mm:ss} | {level} | {message}")
logger.add("logs/pipeline.log", rotation="10 MB", retention="7 days", level="DEBUG")
