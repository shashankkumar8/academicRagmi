import logging
import sys

def setup_logging():
    log_format = "%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d - %(message)s"
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )
    
    # Suppress verbose third-party loggers
    for logger_name in ["httpx", "httpcore", "chromadb", "sentence_transformers", "urllib3", "pdfminer"]:
        logging.getLogger(logger_name).setLevel(logging.WARNING)

logger = logging.getLogger("scholarrag")
