require("dotenv").config();
const pkg = require("./package.json");
const productName = "Torepe";

const config = {
  appId: `net.nekobato.${productName}`,
  asar: true,
  productName,
  directories: {
    output: `release/${pkg.version}`,
  },
  files: ["out"],
  mac: {
    target: ["default"],
    icon: "out/renderer/icons/mac/icon.icns",
    category: "public.app-category.productivity",
    entitlements: "build/entitlements.mac.plist",
    entitlementsInherit: "build/entitlements.mac.plist",
    publish: ["github"],
  },
  win: {
    target: [
      {
        target: "nsis",
        arch: ["x64"],
      },
    ],
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
  },
  linux: {
    target: ["AppImage"],
  },
};

module.exports = config;
