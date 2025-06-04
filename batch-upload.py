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

def create_tree_and_commit():
    """Create a tree with all files and commit at once"""
    project_root = Path('/home/runner/workspace')
    
    # Key directories and files to upload
    important_files = [
        'server/',
        'client/',
        'shared/',
        'backend/',
        'public/',
        'package.json',
        'package-lock.json',
        'tsconfig.json',
        'vite.config.ts',
        'tailwind.config.ts',
        'drizzle.config.ts',
        'components.json',
        'postcss.config.js',
        'README.md',
        '.gitignore'
    ]
    
    tree_items = []
    
    for item in important_files:
        item_path = project_root / item
        
        if item_path.is_file():
            # Single file
            try:
                with open(item_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                content_encoded = base64.b64encode(content.encode('utf-8')).decode('utf-8')
                
                tree_items.append({
                    'path': item,
                    'mode': '100644',
                    'type': 'blob',
                    'content': content_encoded
                })
                print(f'Added file: {item}')
            except Exception as e:
                print(f'Skipped {item}: {e}')
                
        elif item_path.is_dir():
            # Directory - add all files
            for file_path in item_path.rglob('*'):
                if file_path.is_file():
                    relative_path = file_path.relative_to(project_root)
                    
                    # Skip certain files
                    if any(skip in str(relative_path) for skip in ['.git', 'node_modules', '.env', 'dist', 'build']):
                        continue
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                        content_encoded = base64.b64encode(content.encode('utf-8')).decode('utf-8')
                        
                        tree_items.append({
                            'path': str(relative_path).replace('\\', '/'),
                            'mode': '100644',
                            'type': 'blob',
                            'content': content_encoded
                        })
                        print(f'Added file: {relative_path}')
                    except Exception as e:
                        print(f'Skipped {relative_path}: {e}')
    
    # Create tree
    tree_payload = {
        'tree': tree_items,
        'base_tree': None
    }
    
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    print(f'Creating tree with {len(tree_items)} files...')
    tree_response = requests.post(f'{BASE_URL}/git/trees', headers=headers, json=tree_payload)
    
    if tree_response.status_code != 201:
        print(f'Failed to create tree: {tree_response.status_code} - {tree_response.text}')
        return False
    
    tree_sha = tree_response.json()['sha']
    print(f'Tree created with SHA: {tree_sha}')
    
    # Create commit
    commit_payload = {
        'message': 'Initial commit - AI-powered landscaping visualization platform',
        'tree': tree_sha,
        'parents': []
    }
    
    commit_response = requests.post(f'{BASE_URL}/git/commits', headers=headers, json=commit_payload)
    
    if commit_response.status_code != 201:
        print(f'Failed to create commit: {commit_response.status_code} - {commit_response.text}')
        return False
    
    commit_sha = commit_response.json()['sha']
    print(f'Commit created with SHA: {commit_sha}')
    
    # Update main branch reference
    ref_payload = {
        'sha': commit_sha,
        'force': True
    }
    
    ref_response = requests.patch(f'{BASE_URL}/git/refs/heads/main', headers=headers, json=ref_payload)
    
    if ref_response.status_code == 200:
        print('Successfully updated main branch!')
        return True
    else:
        print(f'Failed to update main branch: {ref_response.status_code} - {ref_response.text}')
        return False

if __name__ == '__main__':
    success = create_tree_and_commit()
    if success:
        print(f'\nProject successfully uploaded to: https://github.com/{REPO_OWNER}/{REPO_NAME}')
    else:
        print('\nUpload failed. Please check the errors above.')