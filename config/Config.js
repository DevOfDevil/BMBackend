module.exports = {
  baseUrl: "https://localhost:5000/",
  siteName: "BM_Backend_APIs",
  jwt_expire: "1d",
  jwt_secret: process.env.jwtSecret,
  AdminEmail: process.env.AdminEmail,
  AdminAccountPassword: process.env.AdminAccountPassword,
};
