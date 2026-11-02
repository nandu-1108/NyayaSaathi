import requests

url='http://127.0.0.1:5000/analyse'
payload={"Problem":"someone mis using my photos"}
response=requests.post(url,json=payload)

print(response.status_code)
print(response.text)