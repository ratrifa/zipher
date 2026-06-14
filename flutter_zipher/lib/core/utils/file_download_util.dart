import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:open_file/open_file.dart';
import 'package:path_provider/path_provider.dart';

import '../../models/file_item.dart';
import '../../screens/dashboard/file_preview_screen.dart';
import '../api/api_client.dart';
import '../api/endpoints.dart';
import '../crypto/crypto_service.dart';
import '../storage/secure_storage.dart';

class FileDownloadUtil {
  static Future<void> downloadAndOpenFile(BuildContext context, FileItem item) async {
    if (item.isFolder) return;

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
      // 1. Get private key
      final privateKeyPem = await SecureStorage.instance.getPrivateKey();
      if (privateKeyPem == null) {
        throw Exception('Private Key tidak ditemukan. Silakan login ulang atau pulihkan kunci Anda.');
      }

      // 2. Download file data
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

    // 1. Ask user where to save
    final String? outputFile = await FilePicker.platform.saveFile(
      dialogTitle: 'Simpan file',
      fileName: item.name,
    );

    if (outputFile == null) return;
    if (!context.mounted) return;

    // 2. Show loading dialog
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
      final privateKeyPem = await SecureStorage.instance.getPrivateKey();
      if (privateKeyPem == null) {
        throw Exception('Private Key tidak ditemukan. Silakan login ulang atau pulihkan kunci Anda.');
      }

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

      final file = File(outputFile);
      await file.writeAsBytes(plaintext, flush: true);

      if (context.mounted) {
        Navigator.of(context, rootNavigator: true).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('File berhasil diunduh ke: $outputFile'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
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
}
