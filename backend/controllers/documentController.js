const DocumentModel = require('../models/DocumentModel');

class DocumentController {
    // Upload document (as per FDC 4.2.4)
    static async uploadDocument(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file provided'
                });
            }

            const { document_type } = req.body;

            const document = await DocumentModel.upload(
                req.userId, 
                req.file, 
                document_type || 'other'
            );

            res.status(201).json({
                success: true,
                message: 'Document uploaded successfully',
                document: {
                    id: document.id,
                    file_name: document.file_name,
                    file_type: document.file_type,
                    uploaded_at: document.uploaded_at
                }
            });

        } catch (error) {
            next(error);
        }
    }

    // Get user's documents
    static async getMyDocuments(req, res, next) {
        try {
            const documents = await DocumentModel.getUserDocuments(req.userId);

            res.json({
                success: true,
                // file_path is now a Cloudinary URL stored in DB
                documents
            });

        } catch (error) {
            next(error);
        }
    }

    // Download / redirect to document (Cloudinary URL)
    static async downloadDocument(req, res, next) {
        try {
            const { documentId } = req.params;

            const document = await DocumentModel.findById(documentId);

            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Check if user owns the document or is admin
            if (document.user_id !== req.userId && req.userType !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Redirect to Cloudinary URL
            res.redirect(document.file_path);

        } catch (error) {
            next(error);
        }
    }

    // View document in browser (redirect to Cloudinary URL)
    static async viewDocument(req, res, next) {
        try {
            const { documentId } = req.params;

            const document = await DocumentModel.findById(documentId);

            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Check if user owns the document or is admin
            if (document.user_id !== req.userId && req.userType !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied'
                });
            }

            // Redirect to Cloudinary URL for direct viewing
            res.redirect(document.file_path);

        } catch (error) {
            next(error);
        }
    }

    // Delete document
    static async deleteDocument(req, res, next) {
        try {
            const { documentId } = req.params;

            const deleted = await DocumentModel.delete(documentId, req.userId);

            if (deleted) {
                res.json({
                    success: true,
                    message: 'Document deleted successfully'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

        } catch (error) {
            next(error);
        }
    }

    // Get all documents (admin)
    static async getAllDocuments(req, res, next) {
        try {
            const { page = 1, limit = 20 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            const documents = await DocumentModel.getAll(parseInt(limit), offset);

            res.json({
                success: true,
                documents,
                pagination: {
                    current_page: parseInt(page),
                    limit: parseInt(limit)
                }
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = DocumentController;