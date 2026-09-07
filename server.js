const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const DATA = path.join(DATA_DIR, "db.json");

const sessions = new Map();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

/* =========================
   DATABASE
========================= */

function ensureDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA)) {
    fs.writeFileSync(
      DATA,
      JSON.stringify(
        {
          settings: {
            "Nama kelas": "KELAS TEN_ELEVEN",
            subtitle: "X-11 • SMAN 1 BOJONGGEDE",
            motto:
              "berbeda karakter, satu tujuan. berbeda cerita, satu kelas.",
            deskripsi:
              "satu kelas, banyak cerita. tempat bertumbuh, belajar, ketawa bareng, dan bikin kenangan."
          },
          announcements: [],
          schedule: [
            {
              day: "senin",
              time: "07.00 – 15.00",
              subject:
                "Bahasa Indonesia • Matematika • PPKn"
            },
            {
              day: "selasa",
              time: "07.00 – 15.00",
              subject:
                "Bahasa Inggris • Biologi • Informatika"
            },
            {
              day: "rabu",
              time: "07.00 – 15.00",
              subject:
                "Fisika • Sejarah • PJOK"
            },
            {
              day: "kamis",
              time: "07.00 – 15.00",
              subject:
                "Kimia • Ekonomi • Seni"
            },
            {
              day: "jumat",
              time: "07.00 – 11.30",
              subject:
                "Agama • Projek Kelas • Kegiatan Sekolah"
            }
          ],
          gallery: [],
          users: []
        },
        null,
        2
      )
    );
  }
}

function readDB() {
  ensureDB();

  try {
    return JSON.parse(
      fs.readFileSync(DATA, "utf8")
    );
  } catch {
    return {
      settings: {},
      announcements: [],
      schedule: [],
      gallery: [],
      users: []
    };
  }
}

function writeDB(db) {
  ensureDB();

  fs.writeFileSync(
    DATA,
    JSON.stringify(db, null, 2)
  );
}

/* =========================
   PASSWORD
========================= */

function hashPassword(
  password,
  salt = crypto.randomBytes(16).toString("hex")
) {
  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return {
    salt,
    hash
  };
}

function verifyPassword(password, stored) {
  try {
    if (
      !stored ||
      !stored.salt ||
      !stored.hash
    ) {
      return false;
    }

    const hash = crypto
      .scryptSync(password, stored.salt, 64)
      .toString("hex");

    return crypto.timingSafeEqual(
      Buffer.from(hash, "hex"),
      Buffer.from(stored.hash, "hex")
    );
  } catch {
    return false;
  }
}

/* =========================
   AKUN ADMIN + 42 SISWA
========================= */

function seedAccounts() {
  const db = readDB();

  if (!db.users) {
    db.users = [];
  }

  let changed = false;

  /* ADMIN */

  const adminEmail =
    process.env.ADMIN_EMAIL ||
    "admin@teneleven.local";

  const adminPassword =
    process.env.ADMIN_PASSWORD ||
    "AdminX11!2026";

  let admin = db.users.find(
    u =>
      u.role === "admin" &&
      u.email.toLowerCase() ===
        adminEmail.toLowerCase()
  );

  if (!admin) {
    const p = hashPassword(adminPassword);

    db.users.push({
      id: crypto.randomUUID(),
      name: "Admin X-11",
      email: adminEmail.toLowerCase(),
      password: p,
      role: "admin",
      createdAt: new Date().toISOString()
    });

    changed = true;
  }

  /* 42 SISWA */

  const students = [
    "AIRA AZZAHRA",
    "ALIFALEN RINJANIANSYAH",
    "ALSIVA HERTIKAH SARI",
    "ANANDA SYAKILA AZ ZAHRA",
    "ARFFAN BAIHAQI",
    "Athar Rabis Sheehan",
    "AZKA ASYIFA FAUZIA",
    "AZRIEL AXEL LIE",
    "CALLYSTA AQUINNA ZAHRA",
    "DARVESH GHAIYYAS AQEEL HALIM",
    "DIMAS BAYU PRATAMA",
    "DIMAS DWI NUGROHO",
    "FAIZA RIZKIKA MONZA",
    "FATHANSYAH DWI RIZKI",
    "GAVIN SATYA BAGASKARA",
    "GILANG PUTRA DARMANSYAH",
    "HARDIANSYAH RAFLI",
    "JEDIJA RAYCLE NUGROHO",
    "KAYYASAH ZAHIDAH",
    "KHAIRUL RIZKI",
    "LORENSIUS STEVEN DEVINO",
    "Melvin Augusta Hakim",
    "MOCHAMMAD RESKY RESTYADI",
    "MUHAMAD KHADAVI",
    "MUHAMMAD RAFA MUSTAFID",
    "MUHAMMAD SYAWAL",
    "MUHAMMAD ZULFIKAR RAJABI",
    "NAHDAH TSABITA",
    "NINDYA RESPATIH",
    "PRAWIRA YUDA WICAKSANA",
    "RADITYA ARYA SANTOSO",
    "RAFFA NURFADILLAH",
    "RAKI HANAN ARRASYID",
    "RIBERY AL GHIFARI",
    "RIZKI RAMADHAN",
    "SALWA SAUSAN SALSABIL",
    "SHAFIYYAH ANAQIE MARDANI",
    "SITI AZKAL AZKIA (kia)",
    "TENGKU DELFIO RESIANDA",
    "VINSENSIA SEANA SHERLYN AGNURA (seana)",
    "ZAKARIA KRISNO RAVIANDRA (andra)",
    "ZAUJA"
  ];

  const studentPassword =
    "X11Siswa2026!";

  students.forEach((name, index) => {
    const noAbsen = index + 1;

    const email =
      `siswa${String(noAbsen).padStart(2, "0")}@teneleven.local`;

    const existing = db.users.find(
      u =>
        u.email.toLowerCase() ===
        email.toLowerCase()
    );

    if (!existing) {
      const p =
        hashPassword(studentPassword);

      db.users.push({
        id: crypto.randomUUID(),
        name,
        email,
        password: p,
        role: "student",
        noAbsen,
        createdAt: new Date().toISOString()
      });

      changed = true;
    }
  });

  if (changed) {
    writeDB(db);
  }
}

ensureDB();
seedAccounts();

/* =========================
   AUTH
========================= */

function auth(req, res, next) {
  const token =
    req.headers.authorization?.replace(
      "Bearer ",
      ""
    );

  const session =
    token && sessions.get(token);

  if (!session) {
    return res.status(401).json({
      error: "Belum login."
    });
  }

  const db = readDB();

  const user =
    (db.users || []).find(
      u => u.id === session.userId
    );

  if (!user) {
    return res.status(401).json({
      error: "Akun tidak ditemukan."
    });
  }

  req.user = user;
  req.token = token;

  next();
}

function admin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      error: "Khusus admin."
    });
  }

  next();
}

/* =========================
   REGISTER
========================= */

app.post(
  "/api/register",
  (req, res) => {
    const {
      name,
      email,
      password
    } = req.body;

    if (
      !name ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        error:
          "Semua data wajib diisi."
      });
    }

    if (
      String(password).length < 8
    ) {
      return res.status(400).json({
        error:
          "Password minimal 8 karakter."
      });
    }

    const cleanName =
      String(name).trim();

    const cleanEmail =
      String(email)
        .trim()
        .toLowerCase();

    const db = readDB();

    db.users ||= [];

    if (
      db.users.some(
        u =>
          u.email.toLowerCase() ===
          cleanEmail
      )
    ) {
      return res.status(409).json({
        error:
          "Email sudah terdaftar."
      });
    }

    const p =
      hashPassword(
        String(password)
      );

    const user = {
      id: crypto.randomUUID(),
      name: cleanName,
      email: cleanEmail,
      password: p,
      role: "student",
      createdAt:
        new Date().toISOString()
    };

    db.users.push(user);

    writeDB(db);

    res.json({
      ok: true
    });
  }
);

/* =========================
   LOGIN
========================= */

app.post(
  "/api/login",
  (req, res) => {
    const {
      email,
      password
    } = req.body;

    const db = readDB();

    const cleanEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    const cleanPassword =
      String(password || "");

    const user =
      (db.users || []).find(
        u =>
          u.email.toLowerCase() ===
          cleanEmail
      );

    if (
      !user ||
      !verifyPassword(
        cleanPassword,
        user.password
      )
    ) {
      return res.status(401).json({
        error:
          "Email atau password salah."
      });
    }

    const token =
      crypto.randomBytes(32)
        .toString("hex");

    sessions.set(token, {
      userId: user.id,
      createdAt: Date.now()
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        noAbsen: user.noAbsen || null
      }
    });
  }
);

/* =========================
   LOGOUT
========================= */

app.post(
  "/api/logout",
  auth,
  (req, res) => {
    sessions.delete(
      req.token
    );

    res.json({
      ok: true
    });
  }
);

/* =========================
   ME
========================= */

app.get(
  "/api/me",
  auth,
  (req, res) => {
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        noAbsen:
          req.user.noAbsen ||
          null
      }
    });
  }
);

/* =========================
   SITE
========================= */

app.get(
  "/api/site",
  (req, res) => {
    res.json(readDB());
  }
);

/* =========================
   SETTINGS
========================= */

app.put(
  "/api/settings",
  auth,
  admin,
  (req, res) => {
    const db = readDB();

    db.settings = {
      ...db.settings,
      ...req.body
    };

    writeDB(db);

    res.json(
      db.settings
    );
  }
);

/* =========================
   ANNOUNCEMENTS
========================= */

app.post(
  "/api/announcements",
  auth,
  admin,
  (req, res) => {
    const db = readDB();

    db.announcements ||= [];

    const item = {
      id: Date.now(),
      title: String(
        req.body.title || ""
      ).trim(),
      body: String(
        req.body.body || ""
      ).trim()
    };

    if (
      !item.title ||
      !item.body
    ) {
      return res.status(400).json({
        error:
          "Judul dan isi wajib diisi."
      });
    }

    db.announcements.unshift(
      item
    );

    writeDB(db);

    res.json(item);
  }
);

app.delete(
  "/api/announcements/:id",
  auth,
  admin,
  (req, res) => {
    const db = readDB();

    db.announcements =
      (
        db.announcements ||
        []
      ).filter(
        x =>
          x.id !==
          Number(
            req.params.id
          )
      );

    writeDB(db);

    res.json({
      ok: true
    });
  }
);

/* =========================
   SCHEDULE
========================= */

app.put(
  "/api/schedule",
  auth,
  admin,
  (req, res) => {
    if (
      !Array.isArray(
        req.body.schedule
      )
    ) {
      return res.status(400).json({
        error:
          "Format jadwal tidak valid."
      });
    }

    const db = readDB();

    db.schedule =
      req.body.schedule.map(
        x => ({
          day: String(
            x.day || ""
          ),
          time: String(
            x.time || ""
          ),
          subject: String(
            x.subject || ""
          )
        })
      );

    writeDB(db);

    res.json(
      db.schedule
    );
  }
);

/* =========================
   GALLERY
========================= */

app.post(
  "/api/gallery",
  auth,
  admin,
  (req, res) => {
    const db = readDB();

    db.gallery ||= [];

    const item = {
      id: Date.now(),
      url: String(
        req.body.url || ""
      ).trim(),
      caption: String(
        req.body.caption || ""
      ).trim()
    };

    if (!item.url) {
      return res.status(400).json({
        error:
          "URL gambar wajib diisi."
      });
    }

    db.gallery.push(item);

    writeDB(db);

    res.json(item);
  }
);

app.delete(
  "/api/gallery/:id",
  auth,
  admin,
  (req, res) => {
    const db = readDB();

    db.gallery =
      (
        db.gallery ||
        []
      ).filter(
        x =>
          x.id !==
          Number(
            req.params.id
          )
      );

    writeDB(db);

    res.json({
      ok: true
    });
  }
);

/* =========================
   USERS
========================= */

app.get(
  "/api/users",
  auth,
  admin,
  (req, res) => {
    const db = readDB();

    res.json(
      (db.users || []).map(
        u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          noAbsen:
            u.noAbsen || null,
          createdAt:
            u.createdAt
        })
      )
    );
  }
);

app.delete(
  "/api/users/:id",
  auth,
  admin,
  (req, res) => {
    if (
      req.params.id ===
      req.user.id
    ) {
      return res.status(400).json({
        error:
          "Admin utama tidak bisa menghapus dirinya sendiri."
      });
    }

    const db = readDB();

    db.users =
      (db.users || []).filter(
        u =>
          u.id !==
          req.params.id
      );

    writeDB(db);

    res.json({
      ok: true
    });
  }
);

/* =========================
   FRONTEND
========================= */

app.get(
  "*",
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "public",
        "index.html"
      )
    );
  }
);

/* =========================
   SERVER
========================= */

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `CLASS TEN_ELEVEN running on port ${PORT}`
    );
  }
);
