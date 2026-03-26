const UserModel = require('../models/UserModel');

class HierarchyController {
    static async getOrganizationTree(req, res, next) {
        try {
            const tree = await UserModel.getHierarchy();
            res.json({
                success: true,
                data: tree
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = HierarchyController;
