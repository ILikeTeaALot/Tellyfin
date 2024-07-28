import { app } from "electron";
import * as path from "node:path";

console.log(app.getPath("userData"));
console.log(app.getPath("appData"));
app.setPath("userData", path.join(app.getPath("appData"), "/org.tellyfin.vsh"));
console.log(app.getPath("userData"));
console.log(app.getAppPath());

// app.exit(); // Debugging kill switch