# API Endpoint

## Register

POST /api/v1/register

```json
{
  "username": "user123456",
  "email": "test@gmail.com",
  "password": "password123",
  "password_confirmation": "password123",
  "public_key": "user-public-key"
}
```

## Login

POST /api/v1/login

```json
{
  "email": "test@gmail.com",
  "password": "password123"
}
```

## Current User Info

GET /api/v1/me
(Bearer Token)

## Logout

POST /api/v1/logout
(Bearer Token)

## Search Users

GET /api/v1/users/search?q=searchterm
(Bearer Token)

## Get User Public Key

GET /api/v1/users/{id}/public-key
(Bearer Token)

## List Files

GET /api/v1/files?folder_id=optional-uuid
(Bearer Token)

## Upload File

POST /api/v1/files/upload
(Bearer Token)
Multipart Form Data:

- file: (binary)
- name: "filename.extension"
- mime_type: "application/pdf"
- aes_key_encrypted: "encrypted-aes-key"
- folder_id: "optional-uuid"

## Download File

GET /api/v1/files/{id}/download
(Bearer Token)
Return -> JSON with encrypted data and AES key.

## Update File

PATCH /api/v1/files/{id}
(Bearer Token)

```json
{
  "name": "new-filename.extension",
  "folder_id": "new-folder-uuid"
}
```

## Delete File

DELETE /api/v1/files/{id}
(Bearer Token)

## List Folders

GET /api/v1/folders?parent_id=optional-uuid
(Bearer Token)

## Create Folder

POST /api/v1/folders
(Bearer Token)

```json
{
  "name": "New Folder",
  "parent_id": "optional-parent-uuid"
}
```

## Update Folder

PATCH /api/v1/folders/{id}
(Bearer Token)

```json
{
  "name": "Updated Folder Name",
  "parent_id": "new-parent-uuid"
}
```

## Delete Folder

DELETE /api/v1/folders/{id}
(Bearer Token)

## Share File

POST /api/v1/share
(Bearer Token)

```json
{
  "file_id": "file-uuid",
  "receiver_id": "user-uuid",
  "aes_key_encrypted_for_receiver": "encrypted-aes-key-for-receiver"
}
```

## List Files Shared With Me

GET /api/v1/shared/with-me
(Bearer Token)

## List Files Shared By Me

GET /api/v1/shared/by-me
(Bearer Token)

## Remove Share

DELETE /api/v1/share/{id}
(Bearer Token)
`{id}` ID of share.
