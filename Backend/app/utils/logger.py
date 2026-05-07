import logging

logger = logging.getLogger("task_manager")

logger.setLevel(logging.INFO)

# 🔥 VERY IMPORTANT: Add handler manually
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setLevel(logging.INFO)

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    )

    handler.setFormatter(formatter)
    logger.addHandler(handler)

# 🔥 THIS LINE IS CRITICAL
logger.propagate = False