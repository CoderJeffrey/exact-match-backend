import requests
import json
from bs4 import BeautifulSoup
import pandas as pd
import re

# Set the repository URL and API endpoint
repo_url = "https://api.github.com/repos/pittcsc/Summer2024-Internships"
readme_endpoint = "/readme"

# Set the headers for the API request
headers = {
    "Accept": "application/vnd.github.v3+json"
}

# Send the API request to get the README file
readme_response = requests.get(repo_url + readme_endpoint, headers=headers)

# Parse the response JSON to get the download URL for the README file
readme_json = json.loads(readme_response.content)
readme_download_url = readme_json["download_url"]

# Send a request to download the README file
readme_response = requests.get(readme_download_url)

# Parse the HTML content of the README file using BeautifulSoup
soup = BeautifulSoup(readme_response.content, 'html.parser')

# print out the text of the README file
md = soup.get_text()

# from the markdown file, find the table of internships
# the table header is in the format | Name | Location | Notes |
table_start = md.find("| Name | Location | Notes |")
table_end = md.find("[⬆️ Back to Top ⬆️](https://github.com/pittcsc/Summer2023-Internships#the-list-)", table_start)

# extract the table content
table_content = md[table_start:table_end]


# Split the table content into rows
rows = table_content.split("\n")

# Remove empty rows
rows = [row for row in rows if row.strip()]

# Split the header row into columns
headers = rows[0].split("|")
headers = [header.strip() for header in headers][1:-1]
headers.append("Sponsorship")
headers.append("Link")

# Create a list of dictionaries for each row
data = []
for row in rows[2:]:
    values = row.split("|")[1:]
    values = [value.strip() for value in values]
    if len(values) == 0: continue
    name = values[0]
    link = "null"
    match = re.search(r"\[(.*?)\]\((.*?)\)", name)
    print(match)
    if match:
        name = match.group(1)
        link = match.group(2)
    data.append({
        "Name": name,
        "Location": values[1],
        "Notes": values[2],
        "Sponsorship": "No" if "sponsorship" in values[2].lower() else "Yes",
        "Link": link
    })


# Save the data to a JSON file, overwriting the file each time
with open("scraped_pittcsc.json", "w") as f:
    json.dump(data, f, indent=4)
    



with open("scraped_pittcsc.json", "w") as f:
    json.dump(data, f, indent=4)

