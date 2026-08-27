const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const Document = require('../models/Document');
const Startup = require('../models/Startup');
const AccessRequest = require('../models/AccessRequest');

async function canAccessDocuments(user, startupId) {
  const startup = await Startup.findById(startupId);
  if (!startup) return { allowed: false, startup: null, reason: 'Startup not found' };

  if (startup.founder.toString() === user._id.toString()) {
    return { allowed: true, startup, role: 'founder' };
  }

  if (user.role === 'admin') {
    return { allowed: true, startup, role: 'admin' };
  }

  if (user.role === 'investor') {
    const request = await AccessRequest.findOne({
      startup: startupId,
      investor: user._id,
      status: 'approved',
    });
    if (request) {
      return { allowed: true, startup, role: 'investor' };
    }
    return { allowed: false, startup, reason: 'Access not approved' };
  }

  return { allowed: false, startup, reason: 'Not authorized' };
}

function getResourceType(mimeType = '') {
  if (mimeType.startsWith('image/')) return 'image';
  // pdf, word, excel, ppt, text → raw
  return 'raw';
}

function uploadToCloudinary(buffer, mimeType, folder = 'dih-dataroom') {
  const resourceType = getResourceType(mimeType);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        type: 'upload',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/** Build a working delivery URL for any type */
function getDeliveryUrl(doc) {
  const resourceType = doc.resourceType || getResourceType(doc.mimeType);

  // Prefer signed URL with correct resource_type (no fl_attachment)
  try {
    return cloudinary.utils.url(doc.cloudinaryPublicId, {
      resource_type: resourceType,
      type: 'upload',
      secure: true,
      sign_url: true,
    });
  } catch {
    return doc.cloudinaryUrl;
  }
}

async function fetchCloudFile(doc) {
  const urlsToTry = [];

  // 1) Signed URL with correct resource type
  urlsToTry.push(getDeliveryUrl(doc));

  // 2) Stored secure_url from upload
  if (doc.cloudinaryUrl) {
    urlsToTry.push(doc.cloudinaryUrl);
  }

  // 3) Unsigned URL fallback
  const resourceType = doc.resourceType || getResourceType(doc.mimeType);
  urlsToTry.push(
    cloudinary.utils.url(doc.cloudinaryPublicId, {
      resource_type: resourceType,
      type: 'upload',
      secure: true,
    })
  );

  let lastError = null;

  for (const url of urlsToTry) {
    if (!url) continue;
    try {
      const cloudRes = await fetch(url);
      if (cloudRes.ok) {
        return cloudRes;
      }
      lastError = new Error(`Cloudinary HTTP ${cloudRes.status} for ${url}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('Could not fetch file from Cloudinary');
}

// ====================== UPLOAD (Founder) ======================
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Document title is required' });
    }

    const startup = await Startup.findOne({ founder: req.user._id });
    if (!startup) {
      return res.status(404).json({ success: false, message: 'You do not have a startup yet' });
    }

    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

    const doc = await Document.create({
      startup: startup._id,
      title: title.trim(),
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      cloudinaryPublicId: result.public_id,
      cloudinaryUrl: result.secure_url,
      resourceType: result.resource_type || getResourceType(req.file.mimetype),
      uploadedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: doc,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Upload failed' });
  }
};

// ====================== LIST MY DOCS (Founder) ======================
exports.getMyDocuments = async (req, res) => {
  try {
    const startup = await Startup.findOne({ founder: req.user._id });
    if (!startup) {
      return res.status(404).json({ success: false, message: 'No startup found' });
    }

    const docs = await Document.find({ startup: startup._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: docs.length,
      data: docs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ====================== LIST FOR STARTUP ======================
exports.getStartupDocuments = async (req, res) => {
  try {
    const { startupId } = req.params;
    const access = await canAccessDocuments(req.user, startupId);

    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason || 'Not authorized to view documents',
      });
    }

    const docs = await Document.find({ startup: startupId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: docs.length,
      data: docs,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ====================== DOWNLOAD (all types, founder + investor) ======================
exports.downloadDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const access = await canAccessDocuments(req.user, doc.startup);
    if (!access.allowed) {
      return res.status(403).json({
        success: false,
        message: access.reason || 'Not authorized',
      });
    }

    const cloudRes = await fetchCloudFile(doc);
    const arrayBuffer = await cloudRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = (doc.originalName || 'document').replace(/"/g, '');

    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// ====================== DELETE (Founder) ======================
exports.deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const startup = await Startup.findById(doc.startup);
    if (!startup || startup.founder.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    try {
      await cloudinary.uploader.destroy(doc.cloudinaryPublicId, {
        resource_type: doc.resourceType || getResourceType(doc.mimeType),
      });
    } catch (cloudErr) {
      console.error('Cloudinary delete warning:', cloudErr.message);
    }

    await doc.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Document deleted',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};