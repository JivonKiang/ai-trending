#!/usr/bin/env python3
"""
GitHub AI Trending Fetcher
Fetches popular AI projects from GitHub Search API across multiple timeframes.
"""

import os
import json
import sys
import time
from datetime import datetime, timedelta, timezone
from pathlib import Path

try:
    import requests
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "-q"])
    import requests

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
DATA_DIR = Path(__file__).parent / "data"
HEADERS = {
    "Accept": "application/vnd.github+json",
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "ai-trending-fetcher",
}

AI_TOPICS = "ai,machine-learning,deep-learning,llm,generative-ai,agent,rag,mcp,nlp,computer-vision"

PERIOD_CONFIGS = {
    "daily": {"days": 1, "label": "昨日"},
    "weekly": {"days": 7, "label": "本周"},
    "monthly": {"days": 30, "label": "本月"},
    "halfyearly": {"days": 180, "label": "半年"},
}


def build_query(days_ago: int) -> str:
    since = (datetime.now(timezone.utc) - timedelta(days=days_ago)).strftime("%Y-%m-%d")
    return f"topic:{AI_TOPICS} created:>={since}"


def fetch_repos(query: str, per_page: int = 30) -> list:
    url = "https://api.github.com/search/repositories"
    params = {"q": query, "sort": "stars", "order": "desc", "per_page": per_page}
    resp = requests.get(url, headers=HEADERS, params=params, timeout=30)

    if resp.status_code == 403 and "rate limit" in resp.text.lower():
        print("  Rate limited, waiting 10s...")
        time.sleep(10)
        resp = requests.get(url, headers=HEADERS, params=params, timeout=30)

    resp.raise_for_status()
    data = resp.json()
    return data.get("items", [])


def enrich_repo(repo: dict) -> dict:
    return {
        "name": repo.get("full_name", ""),
        "url": repo.get("html_url", ""),
        "description": repo.get("description") or "",
        "full_description": repo.get("description") or "",
        "language": repo.get("language") or "",
        "stars": repo.get("stargazers_count", 0),
        "stars_gained": 0,
        "forks": repo.get("forks_count", 0),
        "topics": repo.get("topics", []),
        "created_at": repo.get("created_at", ""),
        "updated_at": repo.get("updated_at", ""),
    }


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    all_data = {}

    for period, config in PERIOD_CONFIGS.items():
        print(f"Fetching {period} ({config['label']})...")
        try:
            query = build_query(config["days"])
            raw_repos = fetch_repos(query)
            projects = [enrich_repo(r) for r in raw_repos]
            for i, p in enumerate(projects):
                p["rank"] = i + 1

            result = {
                "updated": datetime.now(timezone.utc).isoformat(),
                "period": period,
                "label": config["label"],
                "count": len(projects),
                "projects": projects,
            }

            output_path = DATA_DIR / f"{period}.json"
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False, indent=2)

            print(f"  -> Saved {len(projects)} projects to {output_path}")
            all_data[period] = result

        except Exception as e:
            print(f"  Error: {e}")
            existing = DATA_DIR / f"{period}.json"
            if not existing.exists():
                result = {
                    "updated": datetime.now(timezone.utc).isoformat(),
                    "period": period, "label": config["label"],
                    "count": 0, "projects": [],
                }
                with open(DATA_DIR / f"{period}.json", "w", encoding="utf-8") as f:
                    json.dump(result, f, ensure_ascii=False, indent=2)

    print("\nFetch complete:")
    for p, d in all_data.items():
        print(f"  {p}: {d['count']} projects")


if __name__ == "__main__":
    main()
