const THUMBNAIL_SIZE = 144;

/**
 * @param {File} file
 */
export async function generateThumbnail(file) {
  const canvas = document.createElement("canvas");
  canvas.width = THUMBNAIL_SIZE;
  canvas.height = THUMBNAIL_SIZE;
  var ctx = canvas.getContext("2d");

  /** @type HTMLImageElement */
  if (file.type.startsWith("image/")) {
    const image = await new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.src = URL.createObjectURL(file);
    });
    ctx.drawImage(image, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  } else if (file.type === "video/mp4") {
    // Generate thumbnail from video
    const video = await new Promise(async (resolve, reject) => {
      const video = document.createElement("video");
      video.muted = true;
      video.src = URL.createObjectURL(file);
      setTimeout(() => reject(new Error("Video load timeout")), 2000);
      await video.play();
      await video.pause();
      video.currentTime = 0;
      resolve(video);
    });
    ctx.drawImage(video, 0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
  }

  /** @type Blob */
  const thumbnailBlob = await new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(blob))
  );

  return thumbnailBlob;
}

/**
 * @param {Blob} blob
 */
export async function blobDigest(blob) {
  const digest = await crypto.subtle.digest("SHA-1", await blob.arrayBuffer());
  const digestArray = Array.from(new Uint8Array(digest));
  const digestHex = digestArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return digestHex;
}

export const SIZE_LIMIT = 100 * 1000 * 1000; // 100MB

/**
 * @param {string} key
 * @param {File} file
 * @param {Record<string, any>} options
 */
export async function multipartUpload(key, file, options) {
  const headers = options?.headers || {};
  headers["content-type"] = file.type;

  // Resume from saved parts (no server query needed)
  let uploadId = options?.uploadId || null;
  let uploadedParts = options?.savedParts ? [...options.savedParts] : [];
  let startPart = 1;

  if (uploadId && uploadedParts.length > 0) {
    const uploadedNumbers = new Set(uploadedParts.map((p) => p.partNumber));
    for (let i = 1; i <= Math.ceil(file.size / SIZE_LIMIT); i++) {
      if (!uploadedNumbers.has(i)) {
        startPart = i;
        break;
      }
    }
    // If all parts already uploaded, complete immediately
    if (startPart > Math.ceil(file.size / SIZE_LIMIT)) {
      const params = new URLSearchParams({ uploadId });
      await axios.post(`/api/write/items/${key}?${params}`, {
        parts: uploadedParts,
      });
      return;
    }
  }

  if (!uploadId) {
    const res = await axios
      .post(`/api/write/items/${key}?uploads`, "", { headers })
      .then((res) => res.data);
    uploadId = res.uploadId;
  }

  const totalChunks = Math.ceil(file.size / SIZE_LIMIT);

  const promiseGenerator = function* () {
    for (let i = startPart; i <= totalChunks; i++) {
      const chunk = file.slice((i - 1) * SIZE_LIMIT, i * SIZE_LIMIT);
      const searchParams = new URLSearchParams({ partNumber: i, uploadId });
      yield axios
        .put(`/api/write/items/${key}?${searchParams}`, chunk, {
          onUploadProgress(progressEvent) {
            if (typeof options?.onUploadProgress !== "function") return;
            // Account for already-uploaded bytes
            const uploadedBytes = (startPart - 1) * SIZE_LIMIT;
            options.onUploadProgress({
              loaded: uploadedBytes + (i - startPart) * SIZE_LIMIT + progressEvent.loaded,
              total: file.size,
            });
          },
        })
        .then((res) => ({
          partNumber: i,
          etag: res.headers.etag,
        }));
    }
  };

  for (const part of promiseGenerator()) {
    const { partNumber, etag } = await part;
    uploadedParts[partNumber - 1] = { partNumber, etag };
    // Persist progress for resume
    if (options?.onPartComplete) {
      options.onPartComplete(uploadId, uploadedParts.filter(Boolean));
    }
  }
  const completeParams = new URLSearchParams({ uploadId });
  await axios.post(`/api/write/items/${key}?${completeParams}`, {
    parts: uploadedParts,
  });
}
