import requests
import json
from bs4 import BeautifulSoup

url = "https://bootcamps.adventiscg.com/summer-internships/internships/summer-analyst-positions-class-of-2025"

response = requests.get(url)
soup = BeautifulSoup(response.content, "html.parser")

# Find the table element
table = soup.find("table")

# Find the tbody element within the table element
tbody = table.find("tbody")

# Find all the rows within the tbody element
rows = tbody.find_all("tr")

# Initialize an empty list to store the job information
jobs = []

# Extract the job title, location, and company name for each row
for row in rows:
    # Find the cells within the row
    cells = row.find_all("td")    

    # Extract the company name from the second cell
    company = cells[1].get_text(strip=True)
    
    # Extract the job title from the ninth cell
    job_title = cells[8].get_text(strip=True)
    
    # Extract the location from the fourth cell
    location = "  ".join([span.get_text(strip=True) for span in cells[3].find_all("span")])
    
    # Create a dictionary object to store the job information
    job = {
        "Name": company,
        "Location": location,
        "Notes": job_title,
    }

    # Append the job information to the list of jobs
    jobs.append(job)

# Dump the list of jobs into a JSON object
json_object = json.dumps(jobs)

# Write the JSON object to a file
with open("scraped_adventis.json", "w") as outfile:
    outfile.write(json_object)
