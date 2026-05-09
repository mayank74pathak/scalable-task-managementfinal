import redis
import os
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")

try:
    if REDIS_URL:
        redis_client = redis.Redis.from_url(
            REDIS_URL,
            decode_responses=True
        )

        redis_client.ping()
        print("Redis connected successfully")

    else:
        redis_client = None
        print("No REDIS_URL found")

except Exception as e:
    print("Redis connection failed:", e)
    redis_client = None
