import 'dart:convert';
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';

import '../../models/file_item.dart';
import '../../screens/dashboard/file_preview_screen.dart';
import '../../screens/widgets/private_key_dialog.dart';
import '../api/api_client.dart';
import '../api/endpoints.dart';
import '../crypto/crypto_service.dart';
import '../storage/secure_storage.dart';

class FileDownloadUtil {
  /// Returns the private key PEM, prompting the user to enter their
  /// seed phrase / private key if it is not found on the device.
  /// Returns null if the key is still unavailable (user cancelled).
  static Future<String?> _ensurePrivateKey(BuildContext context) async {
    var privateKeyPem = await SecureStorage.instance.getPrivateKey();
    if (privateKeyPem != null) return privateKeyPem;

    if (!context.mounted) return null;
    final provided = await showPrivateKeyDialog(context);
    if (!provided) return null;

    privateKeyPem = await SecureStorage.instance.getPrivateKey();
    return privateKeyPem;
  }

  static Future<void> downloadAndOpenFile(BuildContext context, FileItem item) async {
    if (item.isFolder) return;

    // Ensure private key is available (prompt if missing) before doing anything.
    final privateKeyPem = await _ensurePrivateKey(context);
    if (privateKeyPem == null) return;
    if (!context.mounted) return;

    // Show loading dialog
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Dialog(
        backgroundColor: Colors.transparent,
        elevation: 0,
        child: Center(
          child: CircularProgressIndicator(),
        ),
      ),
    );

    try {
      // 1. Download file data
      final res = await dio.get(Endpoints.fileDownload(item.id));
      if (res.statusCode != 200) {
        throw Exception('Gagal mengunduh file.');
      }

      final data = res.data;
      final aesKeyEncryptedBase64 = data['aes_key_encrypted'] as String?;
      final encryptedDataBase64 = data['encrypted_data'] as String?;

      if (aesKeyEncryptedBase64 == null || encryptedDataBase64 == null) {
        throw Exception('Data file tidak valid dari server.');
      }

      // 3. Decode base64
      final aesKeyEncrypted = base64.decode(aesKeyEncryptedBase64);
      final encryptedDataFull = base64.decode(encryptedDataBase64);

      // 4. Decrypt AES Key using RSA Private Key
      final aesKey = await CryptoService.decryptAesKeyWithRsa(aesKeyEncrypted, privateKeyPem);

      // 5. Extract IV and Ciphertext
      // The first 12 bytes of encryptedDataFull is the IV
      if (encryptedDataFull.length <= 12) {
        throw Exception('Ukuran data terenkripsi terlalu kecil.');
      }
      final iv = encryptedDataFull.sublist(0, 12);
      final ciphertext = encryptedDataFull.sublist(12);

      // 6. Decrypt the file using AES-GCM
      final plaintext = await CryptoService.decryptFile(ciphertext, iv, aesKey);

      // 7. Save to temp directory
      final tempDir = await getTemporaryDirectory();
      final savePath = '${tempDir.path}/${item.name}';
      final file = File(savePath);
      await file.writeAsBytes(plaintext, flush: true);

      // 8. Close loading dialog
      if (context.mounted) {
        Navigator.of(context, rootNavigator: true).pop();
      }

      // 9. Open file using native viewer or in-app preview
      if (context.mounted) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => FilePreviewScreen(item: item, localPath: savePath),
          ),
        );
      }
    } catch (e) {
      // Close loading dialog if still showing
      if (context.mounted) {
        Navigator.of(context, rootNavigator: true).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  static Future<void> downloadToDevice(BuildContext context, FileItem item) async {
    if (item.isFolder) return;

    // Ensure private key is available (prompt if missing) before doing anything.
    final privateKeyPem = await _ensurePrivateKey(context);
    if (privateKeyPem == null) return;
    if (!context.mounted) return;

    // 1. Show loading dialog
    var loadingOpen = true;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const Dialog(
        backgroundColor: Colors.transparent,
        elevation: 0,
        child: Center(
          child: CircularProgressIndicator(),
        ),
      ),
    );

    try {
      // 2. Download + decrypt first, so the save dialog can write the bytes.
      final res = await dio.get(Endpoints.fileDownload(item.id));
      if (res.statusCode != 200) throw Exception('Gagal mengunduh file.');

      final data = res.data;
      final aesKeyEncryptedBase64 = data['aes_key_encrypted'] as String?;
      final encryptedDataBase64 = data['encrypted_data'] as String?;

      if (aesKeyEncryptedBase64 == null || encryptedDataBase64 == null) {
        throw Exception('Data file tidak valid dari server.');
      }

      final aesKeyEncrypted = base64.decode(aesKeyEncryptedBase64);
      final encryptedDataFull = base64.decode(encryptedDataBase64);

      final aesKey = await CryptoService.decryptAesKeyWithRsa(aesKeyEncrypted, privateKeyPem);

      if (encryptedDataFull.length <= 12) throw Exception('Ukuran data terenkripsi terlalu kecil.');

      final iv = encryptedDataFull.sublist(0, 12);
      final ciphertext = encryptedDataFull.sublist(12);

      final plaintext = await CryptoService.decryptFile(ciphertext, iv, aesKey);

      // 3. Close loading, then ask where to save. On mobile the picker writes
      // the bytes itself via the system file dialog; on desktop we write them.
      if (context.mounted) Navigator.of(context, rootNavigator: true).pop();
      loadingOpen = false;

      final outputFile = await FilePicker.platform.saveFile(
        dialogTitle: 'Simpan file',
        fileName: item.name,
        bytes: plaintext,
      );
      if (outputFile == null) return;

      if (!(Platform.isAndroid || Platform.isIOS)) {
        await File(outputFile).writeAsBytes(plaintext, flush: true);
      }

      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('File berhasil diunduh ke: $outputFile'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (context.mounted) {
        if (loadingOpen) Navigator.of(context, rootNavigator: true).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString().replaceAll('Exception: ', '')}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
