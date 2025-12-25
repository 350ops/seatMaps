import json
import time
from pathlib import Path
from tqdm import tqdm
from playwright.sync_api import sync_playwright, TimeoutError

INPUT_FILE = "airlines_list.json"
OUTPUT_DIR = Path("airlines_data")
OUTPUT_DIR.mkdir(exist_ok=True)

BASE_TIMEOUT = 30000
DELAY_BETWEEN_REQUESTS = 1.5  # seconds

def scrape_airline(page, airline):
    page.goto(airline["url"], timeout=BASE_TIMEOUT)
    page.wait_for_selector("h1", timeout=BASE_TIMEOUT)

    data = {
        "name": airline["name"],
        "url": airline["url"],
        "aircraft": []
    }

    # Airline title
    data["display_name"] = page.locator("h1").inner_text()

    # Aircraft cards / links
    aircraft_links = page.locator("a[href*='/seatmap/']").all()

    seen = set()
    for link in aircraft_links:
        name = link.inner_text().strip()
        href = link.get_attribute("href")

        if not name or href in seen:
            continue

        seen.add(href)
        data["aircraft"].append({
            "aircraft_name": name,
            "seatmap_url": f"https://seatmaps.com{href}"
        })

    return data

def main():
    airlines = json.load(open(INPUT_FILE, "r", encoding="utf-8"))

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        for airline in tqdm(airlines):
            safe_name = airline["name"].replace("/", "_")
            out_file = OUTPUT_DIR / f"{safe_name}.json"

            if out_file.exists():
                continue  # resume-safe

            try:
                data = scrape_airline(page, airline)
                out_file.write_text(json.dumps(data, indent=2, ensure_ascii=False))
                time.sleep(DELAY_BETWEEN_REQUESTS)

            except TimeoutError:
                print(f"Timeout: {airline['name']}")
            except Exception as e:
                print(f"Error {airline['name']}: {e}")

        browser.close()

if __name__ == "__main__":
    main()