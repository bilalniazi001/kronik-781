const AnnouncementModel = require('../models/AnnouncementModel');
const CacheManager = require('../utils/cacheManager');

// Get all announcements
const getAllAnnouncements = async (req, res) => {
    try {
        // Check cache
        const cachedAnnouncements = CacheManager.get('ANNOUNCEMENTS_LIST');
        if (cachedAnnouncements) {
            return res.json({
                success: true,
                data: cachedAnnouncements,
                from_cache: true
            });
        }

        const announcements = await AnnouncementModel.getAll();
        
        // Cache for 5 minutes
        CacheManager.set('ANNOUNCEMENTS_LIST', announcements, 300);

        res.json({
            success: true,
            data: announcements
        });
    } catch (error) {
        console.error('Error getting announcements:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching announcements',
            error: error.message
        });
    }
};

// Get single announcement
const getAnnouncementById = async (req, res) => {
    try {
        const { id } = req.params;
        const announcement = await AnnouncementModel.getById(id);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        res.json({
            success: true,
            data: announcement
        });
    } catch (error) {
        console.error('Error getting announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching announcement',
            error: error.message
        });
    }
};

// Create new announcement (admin only)
const createAnnouncement = async (req, res) => {
    try {
        const { title, message, content } = req.body;
        const finalMessage = message || content;
        const adminId = req.userId;

        if (!title || !finalMessage) {
            return res.status(400).json({
                success: false,
                message: 'Title and message are required'
            });
        }

        const id = await AnnouncementModel.create(adminId, title, finalMessage);

        // Invalidate cache
        CacheManager.invalidate('ANNOUNCEMENTS_LIST');
        CacheManager.invalidate('ANNOUNCEMENTS_LATEST_5');

        res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            data: { id, title, content: finalMessage, created_at: new Date() }
        });
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating announcement',
            error: error.message
        });
    }
};

// Update announcement (admin only)
const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, message } = req.body;

        const announcement = await AnnouncementModel.getById(id);
        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        await AnnouncementModel.update(id, title, message);

        // Invalidate cache
        CacheManager.invalidate('ANNOUNCEMENTS_LIST');
        CacheManager.invalidate('ANNOUNCEMENTS_LATEST_5');

        res.json({
            success: true,
            message: 'Announcement updated successfully'
        });
    } catch (error) {
        console.error('Error updating announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating announcement',
            error: error.message
        });
    }
};

// Delete announcement (admin only)
const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const announcement = await AnnouncementModel.getById(id);
        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        await AnnouncementModel.delete(id);

        // Invalidate cache
        CacheManager.invalidate('ANNOUNCEMENTS_LIST');
        CacheManager.invalidate('ANNOUNCEMENTS_LATEST_5');

        res.json({
            success: true,
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting announcement',
            error: error.message
        });
    }
};

// Get latest announcements (public)
const getLatestAnnouncements = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 5;
        const cacheKey = `ANNOUNCEMENTS_LATEST_${limit}`;

        // Check cache
        const cachedLatest = CacheManager.get(cacheKey);
        if (cachedLatest) {
            return res.json({
                success: true,
                data: cachedLatest,
                from_cache: true
            });
        }

        const announcements = await AnnouncementModel.getLatest(limit);
        
        // Cache for 5 minutes
        CacheManager.set(cacheKey, announcements, 300);

        res.json({
            success: true,
            data: announcements
        });
    } catch (error) {
        console.error('Error getting latest announcements:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching announcements',
            error: error.message
        });
    }
};

module.exports = {
    getAllAnnouncements,
    getAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getLatestAnnouncements
};