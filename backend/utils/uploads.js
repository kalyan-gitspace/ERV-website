const getRequestOrigin = (req) => {
  const forwardedProto = req.get('x-forwarded-proto');
  const forwardedHost = req.get('x-forwarded-host');
  const protocol = (forwardedProto || req.protocol || 'http').split(',')[0].trim();
  const host = (forwardedHost || req.get('host') || `localhost:${process.env.PORT || 5000}`).split(',')[0].trim();
  return `${protocol}://${host}`;
};

export const resolveUploadUrl = (req, value) => {
  if (typeof value !== 'string') {
    return value;
  }

  const uploadUrl = value.trim();
  if (!uploadUrl) {
    return uploadUrl;
  }

  try {
    const absoluteUrl = new URL(uploadUrl);
    if (absoluteUrl.pathname.startsWith('/uploads/')) {
      const requestOrigin = new URL(getRequestOrigin(req));
      absoluteUrl.protocol = requestOrigin.protocol;
      absoluteUrl.host = requestOrigin.host;
      return absoluteUrl.toString();
    }
    return uploadUrl;
  } catch (error) {
    const uploadPath = uploadUrl.startsWith('/') ? uploadUrl : `/${uploadUrl}`;
    if (uploadPath.startsWith('/uploads/')) {
      return `${getRequestOrigin(req)}${uploadPath}`;
    }
    return uploadUrl;
  }
};

export const serializeProjectUploads = (req, project) => {
  if (!project) {
    return project;
  }

  return {
    ...project,
    main_image: resolveUploadUrl(req, project.main_image),
    gallery_images: Array.isArray(project.gallery_images)
      ? project.gallery_images.map((image) => resolveUploadUrl(req, image))
      : project.gallery_images,
  };
};

export const serializeMediaUpload = (req, media) => {
  if (!media) {
    return media;
  }

  return {
    ...media,
    url: resolveUploadUrl(req, media.url),
    secure_url: resolveUploadUrl(req, media.secure_url),
    path: resolveUploadUrl(req, media.path),
  };
};
