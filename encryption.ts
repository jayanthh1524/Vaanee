import CryptoJS from 'crypto-js';

const SECRET_KEY = 'vaanee-super-secret-key';

export const encryptMessage = (text: string) => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decryptMessage = (cipher: string) => {
  const bytes = CryptoJS.AES.decrypt(cipher, SECRET_KEY);

  return bytes.toString(CryptoJS.enc.Utf8);
};