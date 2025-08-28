import os
import json
import subprocess
import yaml
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
SERVICES_FILE = os.path.join(PROJECT_ROOT, "services.json")
DOCKER_DIR = os.path.join(PROJECT_ROOT, "docker")

COMPOSE_BASE_FILE = os.path.join(DOCKER_DIR, "docker-compose.base.yml")
COMPOSE_FILE = os.path.join(DOCKER_DIR, "docker-compose.generated.yml")

def load_services():
    """Loads service configurations from the JSON file."""
    if os.path.exists(SERVICES_FILE):
        with open(SERVICES_FILE) as f:
            return json.load(f)
    return {"managed": [], "infra": []}

def load_base_compose():
    """Loads the base Docker Compose structure from an external YML file."""
    if os.path.exists(COMPOSE_BASE_FILE):
        with open(COMPOSE_BASE_FILE, 'r') as f:
            return yaml.safe_load(f)
    return {
        "version": "3.9",
        "services": {},
        "volumes": {},
        "networks": {"BKnetwork": None}
    }

def save_services(data):
    """Saves service configurations to the JSON file."""
    with open(SERVICES_FILE, "w") as f:
        json.dump(data, f, indent=2)

@app.route("/list", methods=["GET"])
def list_services():
    """Detects available Docker services and returns managed ones."""
    services = load_services()
    detected = []
    services_root = os.path.join(PROJECT_ROOT, "services")
    if os.path.exists(services_root):
        for folder in os.listdir(services_root):
            path = os.path.join(services_root, folder)
            if os.path.isdir(path) and os.path.exists(os.path.join(path, "Dockerfile")):
                detected.append({"name": folder, "path": f"/{folder}"})
    return jsonify({"detected": detected, "managed": services})

@app.route("/services", methods=["POST"])
def add_service():
    """Adds a new service to the configuration file."""
    data = request.json
    services = load_services()
    if data.get("infra"):
        services["infra"].append(data)
    else:
        services["managed"].append(data)
    save_services(services)
    return jsonify({"status": "ok", "message": "Service added successfully."})

@app.route("/services/<string:name>", methods=["DELETE"])
def delete_service(name):
    """Deletes a service from the configuration file."""
    services = load_services()
    services["managed"] = [s for s in services["managed"] if s["name"] != name]
    services["infra"] = [s for s in services["infra"] if s["name"] != name]
    save_services(services)
    return jsonify({"status": "deleted", "message": f"Service '{name}' deleted."})

@app.route("/generate", methods=["POST"])
def generate_compose():
    """Generates the docker-compose file with correct key order."""
    
    compose = load_base_compose()
    
    services = load_services()

    # Ensure services and networks keys exist before adding
    if 'services' not in compose:
        compose['services'] = {}
    if 'networks' not in compose:
        compose['networks'] = {"BKnetwork": None}
    
    managed_svc_names = []
    for svc in services["managed"]:
        managed_svc_names.append(svc["name"])
        compose_svc = {
            "container_name": f"microns_{svc['name']}",
            "restart": "always",
            "build": {"context": os.path.join("./services", svc["name"])},
            "networks": ["BKnetwork"]
        }
        if "volumes" in svc:
            compose_svc["volumes"] = svc["volumes"]
        
        compose["services"][svc["name"]] = compose_svc

    for infra in services["infra"]:
        entry = {
            "container_name": f"microns_{infra['name']}",
            "restart": "always",
            "image": infra["image"],
            "networks": ["BKnetwork"]
        }
        if "ports" in infra:
            entry["ports"] = infra["ports"]
        if "environment" in infra:
            entry["environment"] = infra["environment"]
        if "volumes" in infra:
            entry["volumes"] = infra["volumes"]
        compose["services"][infra["name"]] = entry
    
    # Reorder the dictionary to ensure YAML output is structured correctly
    final_compose = {
        "version": compose.get("version", "3.9"),
        "services": compose.get("services", {}),
        "volumes": compose.get("volumes", {}),
        "networks": compose.get("networks", {}),
    }

    os.makedirs(DOCKER_DIR, exist_ok=True)
    yaml_string = yaml.dump(final_compose, default_flow_style=False, sort_keys=False)
    
    with open(COMPOSE_FILE, "w") as f:
        yaml.dump(final_compose, f, default_flow_style=False,sort_keys=False)

    return jsonify({"status": "generated", "message": "Docker Compose file generated.","data": yaml_string})
@app.route("/docker/up", methods=["POST"])
def docker_up():
    """Starts the Docker containers with the generated config."""
    try:
        subprocess.run(
            ["docker-compose", "-f", COMPOSE_FILE, "up", "--build", "--remove-orphans", "-d"],
            cwd=PROJECT_ROOT,
            check=True
        )
        return jsonify({"status": "ok", "message": "Docker containers are up."})
    except subprocess.CalledProcessError as e:
        return jsonify({"status": "error", "message": f"Failed to start Docker containers: {e}"}), 500

@app.route("/docker/down", methods=["POST"])
def docker_down():
    """Stops and removes the Docker containers."""
    try:
        subprocess.run(
            ["docker-compose", "-f", COMPOSE_FILE, "down"],
            cwd=PROJECT_ROOT,
            check=True
        )
        return jsonify({"status": "ok", "message": "Docker containers are down."})
    except subprocess.CalledProcessError as e:
        return jsonify({"status": "error", "message": f"Failed to stop Docker containers: {e}"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)