import requests
import json

print('Testing GitIngest API...')
try:
    url = 'https://gitingest-service.onrender.com/api/analyze-repo'
    data = {
        'username': 'TharaneshA',
        'repo': 'SOFT'
    }
    
    print(f'Sending request to {url}')
    print(f'Request data: {json.dumps(data, indent=2)}')
    
    response = requests.post(url, json=data)
    
    print(f'Status Code: {response.status_code}')
    print('Response:')
    print(json.dumps(response.json(), indent=2))
    
except Exception as e:
    print(f'Error: {str(e)}')