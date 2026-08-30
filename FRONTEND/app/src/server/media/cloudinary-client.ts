import "server-only";

import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryEnvironment } from "@/server/media/environment";

let configured = false;

export function getCloudinaryClient() {
  if (!configured) {
    const environment = getCloudinaryEnvironment();
    cloudinary.config({
      cloud_name: environment.CLOUDINARY_CLOUD_NAME,
      api_key: environment.CLOUDINARY_API_KEY,
      api_secret: environment.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}
