#!/usr/bin/env python3
import os
import base64
import requests
import json
from pathlib import Path

# GitHub configuration
GITHUB_TOKEN = os.environ.get('GITHUB_PERSONAL_ACCESS_TOKEN')
REPO_OWNER = 'jrlacey28'
REPO_NAME = 'landscaping-visualization-app-v2'
BASE_URL = f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}'

# Files to exclude
EXCLUDE_PATTERNS = [
    '.git/',
    'node_modules/',
    '.env',
    '.env.local',
    'dist/',
    'build/',
    '.DS_Store',
    '*.log',
    'landscaping-app-for-github.tar.gz',
    'github-upload/',
    'attached_assets/',
    'public/uploads/',
    '.replit',
    'uv.lock'
]

def should_exclude(file_path):
    """Check if file should be excluded based on patterns"""
    for pattern in EXCLUDE_PATTERNS:
        if pattern.endswith('/'):
            if pattern[:-1] in file_path.parts:
                return True
        elif pattern.startswith('*.'):
            if file_path.name.endswith(pattern[1:]):
                return True
        elif pattern in str(file_path):
            return True
    return False

def upload_file(file_path, content):
    """Upload a single file to GitHub"""
    # Convert file path to use forward slashes for GitHub
    github_path = str(file_path).replace('\\', '/')
    
    # Encode content as base64
    if isinstance(content, str):
        content_encoded = base64.b64encode(content.encode('utf-8')).decode('utf-8')
    else:
        content_encoded = base64.b64encode(content).decode('utf-8')
    
    url = f'{BASE_URL}/contents/{github_path}'
    
    payload = {
        'message': f'Add {github_path}',
        'content': content_encoded,
        'branch': 'main'
    }
    
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    response = requests.put(url, headers=headers, json=payload)
    
    if response.status_code in [200, 201]:
        print(f'✓ Uploaded: {github_path}')
        return True
    else:
        print(f'✗ Failed to upload {github_path}: {response.status_code} - {response.text}')
        return False

def main():
    """Main function to upload all project files"""
    project_root = Path('/home/runner/workspace')
    uploaded_count = 0
    failed_count = 0
    
    print(f'Starting upload to {REPO_OWNER}/{REPO_NAME}...')
    
    # Walk through all files in the project
    for file_path in project_root.rglob('*'):
        if file_path.is_file():
            # Get relative path from project root
            relative_path = file_path.relative_to(project_root)
            
            # Skip excluded files
            if should_exclude(relative_path):
                continue
            
            try:
                # Read file content
                try:
                    # Try to read as text first
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                except UnicodeDecodeError:
                    # If text fails, read as binary
                    with open(file_path, 'rb') as f:
                        content = f.read()
                
                # Upload file
                if upload_file(relative_path, content):
                    uploaded_count += 1
                else:
                    failed_count += 1
                    
            except Exception as e:
                print(f'✗ Error processing {relative_path}: {e}')
                failed_count += 1
    
    print(f'\nUpload completed!')
    print(f'✓ Successfully uploaded: {uploaded_count} files')
    print(f'✗ Failed uploads: {failed_count} files')
    print(f'\nRepository URL: https://github.com/{REPO_OWNER}/{REPO_NAME}')

if __name__ == '__main__':
    main()