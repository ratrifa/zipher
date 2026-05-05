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

## Mixed Contents

GET /api/v1/contents?folder_id=optional-uuid
(Bearer Token)
Returns a unified list of files and folders.

## Smart Search

GET /api/v1/search?q=searchterm
(Bearer Token)
Search across both files and folders.

## Starred Files

GET /api/v1/files/starred
(Bearer Token)

## Toggle Star

POST /api/v1/files/{id}/star
(Bearer Token)

## Trash Bin

### Files

GET /api/v1/files/trash
(Bearer Token)

### Folders

GET /api/v1/folders/trash
(Bearer Token)

## Restore from Trash

### File

POST /api/v1/files/{id}/restore
(Bearer Token)

### Folder

POST /api/v1/folders/{id}/restore
(Bearer Token)

## Force Delete (Permanent)

### File

DELETE /api/v1/files/{id}/force
(Bearer Token)

### Folder

DELETE /api/v1/folders/{id}/force
(Bearer Token)

## File Tags

### Get Tags

GET /api/v1/files/{id}/tags
(Bearer Token)

### Replace Tags

PUT /api/v1/files/{id}/tags
(Bearer Token)

```json
{
  "tags": ["tag1", "tag2"]
}
```

### Delete Tag

DELETE /api/v1/files/{id}/tags/{tagId}
(Bearer Token)

## Profile Management

### Update Profile

PATCH /api/v1/profile
(Bearer Token)
`json
{
  "username": "newusername",
  "email": "newemail@example.com"
}
`

### Change Password

POST /api/v1/profile/password
(Bearer Token)
`json
{
  "current_password": "oldpassword",
  "password": "newpassword123",
  "password_confirmation": "newpassword123"
}
`

### Update Avatar

POST /api/v1/profile/avatar
(Bearer Token)
Multipart Form Data:

- avatar: (binary image)
