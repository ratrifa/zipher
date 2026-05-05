# API Testing Summary

This document summarizes the API endpoints available in the Zipher backend, their features, and their current implementation/testing status.

## Version: v1
Base URL: `http://localhost:8000/api/v1`

| Endpoint | Method | Feature | Status |
| :--- | :--- | :--- | :--- |
| `/register` | POST | Register a new account | ✅ Tested (Success) |
| `/login` | POST | Login to an account | ✅ Tested (Success) |
| `/forgot-password` | POST | Request password reset | ⚠️ Tested (Requires Mail Config) |
| `/reset-password` | POST | Reset password with token | ⚠️ Implemented (Not fully tested) |
| `/me` | GET | Get current authenticated user | ✅ Implemented |
| `/logout` | POST | Logout current user | ✅ Implemented |
| `/users/search` | GET | Search for users | ✅ Implemented |
| `/users/{id}/public-key` | GET | Get a user's public key | ✅ Implemented |
| `/contents` | GET | Get mixed files and folders | ✅ Implemented |
| `/search` | GET | Smart search across files/folders | ✅ Implemented |
| `/files` | GET | List user files | ✅ Implemented |
| `/files/upload` | POST | Upload a new file | ✅ Implemented |
| `/files/starred` | GET | List starred files | ✅ Implemented |
| `/files/trash` | GET | List deleted files | ✅ Implemented |
| `/files/{id}/star` | POST | Toggle star status | ✅ Implemented |
| `/files/{id}/download` | GET | Download a file | ✅ Implemented |
| `/files/{id}` | PATCH | Update file metadata | ✅ Implemented |
| `/files/{id}` | DELETE | Move file to trash | ✅ Implemented |
| `/files/{id}/restore` | POST | Restore file from trash | ✅ Implemented |
| `/files/{id}/force` | DELETE | Permanently delete file | ✅ Implemented |
| `/files/{id}/tags` | GET | Get file tags | ✅ Implemented |
| `/files/{id}/tags` | PUT | Replace all file tags | ✅ Implemented |
| `/files/{id}/tags/{tagId}` | DELETE | Remove specific tag | ✅ Implemented |
| `/folders` | GET | List user folders | ✅ Implemented |
| `/folders` | POST | Create a new folder | ✅ Implemented |
| `/folders/trash` | GET | List deleted folders | ✅ Implemented |
| `/folders/{id}` | PATCH | Update folder metadata | ✅ Implemented |
| `/folders/{id}` | DELETE | Move folder to trash | ✅ Implemented |
| `/folders/{id}/restore` | POST | Restore folder from trash | ✅ Implemented |
| `/folders/{id}/force` | DELETE | Permanently delete folder | ✅ Implemented |
| `/share` | POST | Share a file with another user | ✅ Implemented |
| `/shared/with-me` | GET | List files shared with current user | ✅ Implemented |
| `/shared/by-me` | GET | List files shared by current user | ✅ Implemented |
| `/share/{id}` | DELETE | Revoke file share | ✅ Implemented |
| `/profile` | PATCH | Update profile (username, email) | ✅ Implemented |
| `/profile/password` | POST | Change user password | ✅ Implemented |
| `/profile/avatar` | POST | Upload/Update profile avatar | ✅ Implemented |

## Testing Status
*   **Server:** ✅ Running on `http://localhost:8000`.
*   **Database:** ✅ SQLite with migrations and seeding.
*   **Registration:** ✅ Verified with live request.
*   **Login:** ✅ Verified with live request (returns Sanctum token).
*   **Forgot Password:** ⚠️ Route works and logic is in place, but requires a configured mail server to send actual emails.
*   **Authentication:** 🔒 Sanctum Bearer tokens verified.
