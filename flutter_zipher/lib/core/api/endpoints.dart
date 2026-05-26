class Endpoints {
  // Change to your server URL for production
  static const baseUrl = 'http://10.0.2.2:8000'; // Android emulator → localhost
  // static const baseUrl = 'http://localhost:8000'; // iOS simulator

  static const _v1 = '$baseUrl/api/v1';

  // Auth
  static const login = '$_v1/login';
  static const register = '$_v1/register';
  static const logout = '$_v1/logout';
  static const me = '$_v1/me';
  static const forgotPassword = '$_v1/forgot-password';
  static const verifyResetKey = '$_v1/verify-reset-key';
  static const resetPassword = '$_v1/reset-password';
  static const usersSearch = '$_v1/users/search';

  // Files
  static const files = '$_v1/files';
  static const filesUpload = '$_v1/files/upload';
  static String fileById(String id) => '$_v1/files/$id';
  static String fileDownload(String id) => '$_v1/files/$id/download';
  static String fileKey(String id) => '$_v1/files/$id/key';
  static String fileStar(String id) => '$_v1/files/$id/star';
  static String fileRestore(String id) => '$_v1/files/$id/restore';
  static String fileForceDelete(String id) => '$_v1/files/$id/force';
  static const filesStarred = '$_v1/files/starred';
  static const filesTrash = '$_v1/files/trash';

  // Folders
  static const folders = '$_v1/folders';
  static String folderById(String id) => '$_v1/folders/$id';
  static String folderStar(String id) => '$_v1/folders/$id/star';
  static String folderRestore(String id) => '$_v1/folders/$id/restore';
  static String folderForceDelete(String id) => '$_v1/folders/$id/force';
  static const foldersTrash = '$_v1/folders/trash';

  // Contents (files + folders combined)
  static const contents = '$_v1/contents';
  static const contentsMove = '$_v1/contents/move';

  // Sharing
  static const share = '$_v1/share';
  static String shareRevoke(String id) => '$_v1/share/$id';
  static const sharedWithMe = '$_v1/shared/with-me';
  static const sharedByMe = '$_v1/shared/by-me';
  static String sharedReceivedDelete(String shareId) => '$_v1/shared/received/$shareId';

  // Recent
  static const recent = '$_v1/recent';

  // Search
  static const search = '$_v1/search';

  // Storage
  static const storageBreakdown = '$_v1/storage/breakdown';

  // Profile
  static const profile = '$_v1/profile';
  static const profilePassword = '$_v1/profile/password';
  static const profileAvatar = '$_v1/profile/avatar';

  // Reports
  static const reports = '$_v1/reports';

  // Avatar image
  static String avatarUrl(String path) => '$baseUrl/storage/$path';
}
