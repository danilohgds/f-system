import logging
import sys

def setup_logger(name: str = "filesystem_api") -> logging.Logger:
    """Configure and return a logger with human-readable formatting"""

    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    # Avoid duplicate handlers
    if logger.handlers:
        return logger

    # Console handler with colored output
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.INFO)

    # Human-readable format
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(message)s',
        datefmt='%H:%M:%S'
    )
    handler.setFormatter(formatter)

    logger.addHandler(handler)
    return logger
