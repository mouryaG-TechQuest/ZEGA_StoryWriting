
import requests
import time
import sys

def check_health():
    url = "http://localhost:8002/health"
    for i in range(10):
        try:
            response = requests.get(url)
            if response.status_code == 200:
                print("Health check passed:", response.json())
                return True
        except requests.exceptions.ConnectionError:
            print(f"Waiting for service... ({i+1}/10)")
            time.sleep(2)
    print("Service failed to start or is not reachable.")
    return False

if __name__ == "__main__":
    if check_health():
        sys.exit(0)
    else:
        sys.exit(1)
