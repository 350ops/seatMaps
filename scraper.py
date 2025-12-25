import json
import csv
from playwright.sync_api import sync_playwright

URL = "https://seatmaps.com/airlines/"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(URL, timeout=60000)
    
    # Wait for airline list items — SeatMaps puts them in <li> elements
    page.wait_for_selector("li a", timeout=60000)

    # Extract airline names from the anchor text
    airline_elements = page.query_selector_all("li a")
    airlines = [elem.inner_text().strip() for elem in airline_elements if elem.inner_text().strip()]

    browser.close()

# Save to CSV
with open("airlines_list.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["Airline"])
    for a in airlines:
        writer.writerow([a])

# Save to JSON
with open("airlines_list.json", "w", encoding="utf-8") as f:
    json.dump(airlines, f, ensure_ascii=False, indent=2)

print(f"Scraped {len(airlines)} airlines 🇺🇳")