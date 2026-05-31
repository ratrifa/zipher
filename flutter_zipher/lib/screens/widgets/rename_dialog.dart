import 'package:flutter/material.dart';

Future<String?> showRenameDialog(BuildContext context, {required String currentName}) {
  final parts = currentName.split('.');
  final nameWithoutExt = parts.length > 1 ? parts.sublist(0, parts.length - 1).join('.') : currentName;
  final ext = parts.length > 1 ? '.${parts.last}' : '';
  final ctrl = TextEditingController(text: nameWithoutExt);

  return showDialog<String>(
    context: context,
    builder: (ctx) => AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      title: const Text('Ganti Nama', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
      content: TextField(
        controller: ctrl,
        autofocus: true,
        decoration: InputDecoration(
          suffixText: ext,
          suffixStyle: const TextStyle(color: Color(0xFF9ca3af)),
        ),
        onSubmitted: (v) {
          if (v.trim().isNotEmpty) Navigator.pop(ctx, '${v.trim()}$ext');
        },
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
        TextButton(
          onPressed: () {
            final name = ctrl.text.trim();
            if (name.isNotEmpty) Navigator.pop(ctx, '$name$ext');
          },
          child: const Text('Simpan', style: TextStyle(fontWeight: FontWeight.w600)),
        ),
      ],
    ),
  );
}
