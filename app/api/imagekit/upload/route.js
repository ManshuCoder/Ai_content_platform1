export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import ImageKit from "imagekit";
import { auth } from "@clerk/nextjs/server";

function createImageKitClient() {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY?.trim();
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim();

  if (!publicKey || !privateKey || !urlEndpoint) {
    throw new Error(
      "Missing ImageKit configuration. Set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT in your environment."
    );
  }

  return new ImageKit({
    publicKey,
    privateKey,
    urlEndpoint,
  });
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const imagekit = createImageKitClient();

    const formData = await request.formData();
    const file = formData.get("file");
    const fileName = formData.get("fileName")?.toString() || "upload";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const uniqueFileName = `${userId}/${timestamp}_${sanitizedFileName}`;

    const uploadResponse = await imagekit.upload({
      file: buffer,
      fileName: uniqueFileName,
      folder: "/blog_images",
    });

    return NextResponse.json({
      success: true,
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      width: uploadResponse.width,
      height: uploadResponse.height,
      size: uploadResponse.size,
      name: uploadResponse.name,
    });
  } catch (error) {
    console.error("ImageKit upload error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload image",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
