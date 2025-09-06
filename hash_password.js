// hash_password.js
import bcrypt from "bcrypt";

const password = "admin123"; // 🔑 password yang mau di-hash
const saltRounds = 10; // level keamanan

bcrypt.hash(password, saltRounds, function (err, hash) {
  if (err) {
    console.error("Gagal hash password:", err);
  } else {
    console.log("Password:", password);
    console.log("Hash bcrypt:", hash);
  }
});
