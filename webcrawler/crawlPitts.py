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
# print(readme_download_url)

# Send a request to download the README file
readme_response = requests.get(readme_download_url)
raw_readme = readme_response.text
# print(raw_readme)

# find the table of internships
# | Company | Role | Location | Application/Link | Date Posted |
# | --- | --- | --- | :---: | :---: |
table_start = raw_readme.find("| Company | Role | Location | Application/Link | Date Posted |")
table_end = raw_readme.find("[⬆️ Back to Top ⬆️]")

# for each row, split the columns and add to a list of dictionaries
rows = raw_readme[table_start:table_end].split("\n")
rows = [row for row in rows if row.strip()]
rows = rows[2:]

# For each in row, split the columns and add to a list of dictionaries split by |
data = []
for row in rows:
    values = row.split("|")[1:]
    values = [value.strip() for value in values]
    if len(values) == 0: continue
    name = values[0]
    link = values[3]
    data.append({
        "Name": name,
        "Role": values[1],
        "Location": values[2],
        "Link": link,
    })

# For each in data, remove the ** ** around the company name
for i in range(len(data)):
    data[i]["Name"] = data[i]["Name"].replace("**", "")
    # if the name is in markdown link format, remove the []() keep what's in []
    if data[i]["Name"].find("[") != -1:
        data[i]["Name"] = data[i]["Name"][data[i]["Name"].find("[")+1 : data[i]["Name"].find("]")]

    # the link is going to look like <a href="...">...<img></img></a>, only keep the href part
    # keep the part between the first href=" and the first ">
    link = data[i]["Link"]
    if link == "🔒":
        # remove this row
        data[i] = None
        continue
    link_start = link.find("href=\"")
    link_end = link.find("\">")
    data[i]["Link"] = link[link_start+6 : link_end]

    # Search for 🛂🇺🇸 in the role, if it exists, remove the symbol and add a "sponsorship" field as "no"
    if data[i]["Role"].find("🛂") != -1 or data[i]["Role"].find("🇺🇸") != -1:
        data[i]["Sponsorship"] = "No"
        data[i]["Role"] = data[i]["Role"].replace("🛂", "")
        data[i]["Role"] = data[i]["Role"].replace("🇺🇸", "")
    else:
        data[i]["Sponsorship"] = "Yes"

    # Remove "Role" field and replace with "Notes" field
    data[i]["Notes"] = data[i]["Role"]
    data[i].pop("Role")

# Remove none values
data = [d for d in data if d is not None]

# Dump the list of jobs into a JSON object
with open("scraped_pittcsc.json", "w") as outfile:
    json.dump(data, outfile, indent=4)