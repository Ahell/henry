module.exports = {
  apps: [
    {
      name: "henry-api",
      cwd: "/home/initium/webapps/henry/server",
      script: "server.js",
      env: {
        HOST: "127.0.0.1",
        PORT: "3001",
        NODE_ENV: "production",
      },
    },
    {
      name: "henry-web",
      cwd: "/home/initium/webapps/henry",
      script: "npm",
      args: "run dev:client",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
