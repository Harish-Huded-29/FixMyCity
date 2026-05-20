// ============================================
// FixMyCity - Municipal Controller
// Routes for municipal workers to manage issues
// ============================================

const Issue = require('../models/Issue');
const User = require('../models/User');

// GET /api/municipal/issues — filtered to their area
const getMunicipalIssues = async (req, res) => {
  const worker = await User.findById(req.user.id);
  const { status, category, page = 1, limit = 20 } = req.query;

  const filter = { isDeleted: false };
  // Filter to municipal worker's assigned area
  if (worker.municipalArea && worker.municipalArea.city) {
    filter['location.city'] = { $regex: new RegExp(worker.municipalArea.city, 'i') };
  }
  if (status)   filter.status   = status;
  if (category) filter.category = category;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Issue.countDocuments(filter);

  const issues = await Issue.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('postedBy', 'name')
    .populate('assignedTo', 'name');

  // Stats summary
  const stats = await Issue.aggregate([
    { $match: { isDeleted: false, ...filter } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.json({ success: true, total, issues, stats });
};

// PUT /api/municipal/issues/:id/status — update status
const updateIssueStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['open', 'in_progress', 'resolved', 'closed'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const issue = await Issue.findById(req.params.id);
  if (!issue || issue.isDeleted) {
    return res.status(404).json({ success: false, message: 'Issue not found' });
  }

  issue.status = status;
  await issue.save();
  res.json({ success: true, issue });
};

// POST /api/municipal/issues/:id/resolve — mark resolved with photos/description
const resolveIssue = async (req, res) => {
  const { description } = req.body;
  const issue = await Issue.findById(req.params.id);
  if (!issue || issue.isDeleted) {
    return res.status(404).json({ success: false, message: 'Issue not found' });
  }

  const media = (req.files || []).map(file => ({
    url: file.path, publicId: file.filename,
    resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image',
  }));

  issue.status = 'resolved';
  issue.resolution = {
    resolvedBy: req.user.id,
    description: description || 'Issue has been resolved.',
    media,
    resolvedAt: new Date(),
  };

  await issue.save();

  // Increment resolved count for this municipal worker
  await User.findByIdAndUpdate(req.user.id, { $inc: { issuesResolved: 1 } });

  await issue.populate('resolution.resolvedBy', 'name profilePhoto');
  res.json({ success: true, message: 'Issue marked as resolved', issue });
};

// GET /api/municipal/stats — dashboard stats
const getMunicipalStats = async (req, res) => {
  const worker = await User.findById(req.user.id);
  const areaFilter = {};
  if (worker.municipalArea && worker.municipalArea.city) {
    areaFilter['location.city'] = { $regex: new RegExp(worker.municipalArea.city, 'i') };
  }

  const [total, open, inProgress, resolved, reopened] = await Promise.all([
    Issue.countDocuments({ ...areaFilter, isDeleted: false }),
    Issue.countDocuments({ ...areaFilter, status: 'open', isDeleted: false }),
    Issue.countDocuments({ ...areaFilter, status: 'in_progress', isDeleted: false }),
    Issue.countDocuments({ ...areaFilter, status: 'resolved', isDeleted: false }),
    Issue.countDocuments({ ...areaFilter, status: 'reopened', isDeleted: false }),
  ]);

  res.json({ success: true, stats: { total, open, inProgress, resolved, reopened } });
};

module.exports = { getMunicipalIssues, updateIssueStatus, resolveIssue, getMunicipalStats };
