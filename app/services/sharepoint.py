from typing import List, Dict
import os

# NOTE: This is a stub. Replace with Microsoft Graph calls.
# Keep the function signatures stable to swap in real implementations later.

def list_sharepoint_files() -> List[Dict]:
    tenant = os.getenv('SP_TENANT_ID')
    client_id = os.getenv('SP_CLIENT_ID')
    secret = os.getenv('SP_CLIENT_SECRET')
    site = os.getenv('SP_SITE_ID')
    if not all([tenant, client_id, secret, site]):
        # Graceful demo mode
        return [{"id":"demo1","name":"Sample_RFP.pdf","size":123456}]
    # TODO: Implement MS Graph listing and return real items
    return []

def download_sharepoint_file(file_id: str, dest_path: str) -> bool:
    # TODO: Implement MS Graph download
    # For now, produce a demo file
    with open(dest_path, 'wb') as f:
        f.write(b'%PDF-1.4\n% Demo PDF placeholder. Drop real integration here.')
    return True
