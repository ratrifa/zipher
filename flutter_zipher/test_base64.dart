import 'dart:convert';

void main() {
  try {
    base64.decode('SGVsbG8=\r\n');
    print('SUCCESS');
  } catch (e) {
    print('ERROR TYPE: ');
  }
}