const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, "data", "db.json");
const sessions = new Map();

app.use(express.json({limit:"1mb"}));
app.use(express.static(path.join(__dirname, "public")));

function readDB(){ return JSON.parse(fs.readFileSync(DATA, "utf8")); }
function writeDB(db){ fs.writeFileSync(DATA, JSON.stringify(db, null, 2)); }

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")){
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return {salt, hash};
}

function verifyPassword(password, stored){
  try {
    const hash = crypto.scryptSync(password, stored.salt, 64).toString("hex");
    return crypto.timingSafeEqual(
      Buffer.from(hash,"hex"),
      Buffer.from(stored.hash,"hex")
    );
  } catch {
    return false;
  }
}

function seedAdmin(){
  const db = readDB();

  if(!db.users) db.users = [];

  if(!db.users.some(u => u.role === "admin")){
    const p = hashPassword(
      process.env.ADMIN_PASSWORD || "AdminX11!2026"
    );

    db.users.push({
      id: crypto.randomUUID(),
      name: "Admin X-11",
      email: process.env.ADMIN_EMAIL || "admin@teneleven.local",
      password: p,
      role: "admin",
      createdAt: new Date().toISOString()
    });

    writeDB(db);
  }
}

seedAdmin();

function auth(req,res,next){
  const token = req.headers.authorization?.replace("Bearer ","");
  const session = token && sessions.get(token);

  if(!session)
    return res.status(401).json({error:"Belum login."});

  const db = readDB();

  const user = db.users?.find(
    u => u.id === session.userId
  );

  if(!user)
    return res.status(401).json({error:"Akun tidak ditemukan."});

  req.user = user;
  next();
}

function admin(req,res,next){
  if(req.user.role !== "admin")
    return res.status(403).json({error:"Khusus admin."});

  next();
}

app.post("/api/register",(req,res)=>{
  const {name,email,password} = req.body;

  if(!name || !email || !password)
    return res.status(400).json({
      error:"Semua data wajib diisi."
    });

  if(password.length < 8)
    return res.status(400).json({
      error:"Password minimal 8 karakter."
    });

  const db = readDB();
  db.users ||= [];

  if(db.users.some(
    u => u.email.toLowerCase() === email.toLowerCase()
  )){
    return res.status(409).json({
      error:"Email sudah terdaftar."
    });
  }

  const p = hashPassword(password);

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: p,
    role: "student",
    createdAt: new Date().toISOString()
  };

  db.users.push(user);
  writeDB(db);

  res.json({ok:true});
});

app.post("/api/login",(req,res)=>{
  const {email,password} = req.body;
  const db = readDB();

  const user = (db.users || []).find(
    u => u.email.toLowerCase() ===
      String(email || "").toLowerCase()
  );

  if(
    !user ||
    !verifyPassword(
      String(password || ""),
      user.password
    )
  ){
    return res.status(401).json({
      error:"Email atau password salah."
    });
  }

  const token = crypto.randomBytes(32).toString("hex");

  sessions.set(token,{
    userId:user.id,
    createdAt:Date.now()
  });

  res.json({
    token,
    user:{
      id:user.id,
      name:user.name,
      email:user.email,
      role:user.role
    }
  });
});

app.post("/api/logout",auth,(req,res)=>{
  const token =
    req.headers.authorization?.replace("Bearer ","");

  sessions.delete(token);

  res.json({ok:true});
});

app.get("/api/me",auth,(req,res)=>{
  res.json({
    user:{
      id:req.user.id,
      name:req.user.name,
      email:req.user.email,
      role:req.user.role
    }
  });
});

app.get("/api/site",(req,res)=>{
  res.json(readDB());
});

app.put("/api/settings",auth,admin,(req,res)=>{
  const db = readDB();

  db.settings = {
    ...db.settings,
    ...req.body
  };

  writeDB(db);

  res.json(db.settings);
});

app.post("/api/announcements",auth,admin,(req,res)=>{
  const db = readDB();
  db.announcements ||= [];

  const item = {
    id:Date.now(),
    title:String(req.body.title || "").trim(),
    body:String(req.body.body || "").trim()
  };

  if(!item.title || !item.body)
    return res.status(400).json({
      error:"Judul dan isi wajib diisi."
    });

  db.announcements.unshift(item);
  writeDB(db);

  res.json(item);
});

app.delete("/api/announcements/:id",auth,admin,(req,res)=>{
  const db = readDB();

  db.announcements =
    (db.announcements || [])
    .filter(x => x.id !== Number(req.params.id));

  writeDB(db);

  res.json({ok:true});
});

app.put("/api/schedule",auth,admin,(req,res)=>{
  if(!Array.isArray(req.body.schedule))
    return res.status(400).json({
      error:"Format jadwal tidak valid."
    });

  const db = readDB();

  db.schedule = req.body.schedule.map(x => ({
    day:String(x.day || ""),
    time:String(x.time || ""),
    subject:String(x.subject || "")
  }));

  writeDB(db);

  res.json(db.schedule);
});

app.post("/api/gallery",auth,admin,(req,res)=>{
  const db = readDB();
  db.gallery ||= [];

  const item = {
    id:Date.now(),
    url:String(req.body.url || "").trim(),
    caption:String(req.body.caption || "").trim()
  };

  if(!item.url)
    return res.status(400).json({
      error:"URL gambar wajib diisi."
    });

  db.gallery.push(item);
  writeDB(db);

  res.json(item);
});

app.delete("/api/gallery/:id",auth,admin,(req,res)=>{
  const db = readDB();

  db.gallery =
    (db.gallery || [])
    .filter(x => x.id !== Number(req.params.id));

  writeDB(db);

  res.json({ok:true});
});

app.get("/api/users",auth,admin,(req,res)=>{
  const db = readDB();

  res.json(
    (db.users || []).map(u => ({
      id:u.id,
      name:u.name,
      email:u.email,
      role:u.role,
      createdAt:u.createdAt
    }))
  );
});

app.delete("/api/users/:id",auth,admin,(req,res)=>{
  if(req.params.id === req.user.id)
    return res.status(400).json({
      error:"Admin utama tidak bisa menghapus dirinya sendiri."
    });

  const db = readDB();

  db.users =
    (db.users || [])
    .filter(u => u.id !== req.params.id);

  writeDB(db);

  res.json({ok:true});
});

app.get("*",(req,res)=>{
  res.sendFile(
    path.join(__dirname,"public","index.html")
  );
});

/* penting untuk Render */
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `CLASS TEN_ELEVEN running on port ${PORT}`
  );
});
