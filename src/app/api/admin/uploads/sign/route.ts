import type { NextRequest, NextResponse } from "next/server";
import { authorizeStaff } from "@/app/admin/_lib/staff";
import { CLOUDINARY_FOLDER, CLOUDINARY_FORMATS, signCloudinaryParams } from "@/lib/cloudinary";
import { fail, success } from "../../_lib/http";

export const runtime = "nodejs";

/**
 * Gives a signed staff member the parameters for one direct browser-to-Cloudinary image upload. The API secret
 * never leaves the server, and the signature fixes the folder and allowed formats.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const staff = await authorizeStaff(request);
  if (!("uid" in staff)) return staff;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  const apiKey = process.env.CLOUDINARY_API_KEY ?? "";
  const apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
  if (!cloudName || !apiKey || !apiSecret) return fail(503, "not_configured");

  const timestamp = Math.floor(Date.now() / 1000);
  const signed = { allowed_formats: CLOUDINARY_FORMATS, folder: CLOUDINARY_FOLDER, timestamp };
  return success({
    cloudName,
    apiKey,
    timestamp,
    folder: CLOUDINARY_FOLDER,
    allowedFormats: CLOUDINARY_FORMATS,
    signature: signCloudinaryParams(signed, apiSecret),
  });
}
