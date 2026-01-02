module.exports = {
  apps: [
    {
      name: "henry",
      cwd: "/home/initium/webapps/henry",
      script: "server/server.js",
      env: {
        HOST: "0.0.0.0",
        PORT: "3002",
        NODE_ENV: "production",
      },
    },
  ],
};
