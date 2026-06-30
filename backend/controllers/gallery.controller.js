import { galleryService } from '../services/gallery.service.js';
import { dashboardService } from '../services/dashboard.service.js';

export const galleryController = {
  // =========================================================================
  // CATEGORY CONTROLLERS
  // =========================================================================

  async getAllCategories(req, res, next) {
    try {
      const categories = await galleryService.getAllCategories();
      return res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  },

  async createCategory(req, res, next) {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'Category name is required.' });
      }

      const category = await galleryService.createCategory(name);
      
      await dashboardService.logAdminActivity(
        req.admin.sub,
        'CREATE_GALLERY_CATEGORY',
        { categoryId: category.id, name: category.name },
        req.ip
      );

      return res.status(201).json({
        message: 'Category created successfully.',
        category
      });
    } catch (error) {
      next(error);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body;
      if (!name) {
        return res.status(400).json({ message: 'Category name is required.' });
      }

      const category = await galleryService.updateCategory(id, name);
      if (!category) {
        return res.status(404).json({ message: 'Category not found.' });
      }

      await dashboardService.logAdminActivity(
        req.admin.sub,
        'UPDATE_GALLERY_CATEGORY',
        { categoryId: id, name: category.name },
        req.ip
      );

      return res.status(200).json({
        message: 'Category updated successfully.',
        category
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await galleryService.deleteCategory(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Category not found.' });
      }

      await dashboardService.logAdminActivity(
        req.admin.sub,
        'DELETE_GALLERY_CATEGORY',
        { categoryId: id },
        req.ip
      );

      return res.status(200).json({ message: 'Category deleted successfully.' });
    } catch (error) {
      next(error);
    }
  },

  // =========================================================================
  // GALLERY ITEM CONTROLLERS
  // =========================================================================

  /**
   * Get paginated gallery items (Public & Admin)
   */
  async getItems(req, res, next) {
    try {
      const { categorySlug, tag, page, limit } = req.query;
      const result = await galleryService.getGalleryItems({
        categorySlug,
        tag,
        page,
        limit
      });
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },

  async getItemById(req, res, next) {
    try {
      const { id } = req.params;
      const item = await galleryService.getGalleryItemById(id);
      if (!item) {
        return res.status(404).json({ message: 'Gallery item not found.' });
      }
      return res.status(200).json(item);
    } catch (error) {
      next(error);
    }
  },

  async createItem(req, res, next) {
    try {
      const itemData = req.body;
      if (!itemData.category_id || !itemData.image_media_id || !itemData.title) {
        return res.status(400).json({ message: 'Missing required fields: category_id, image_media_id, title' });
      }

      const item = await galleryService.createGalleryItem(itemData);

      await dashboardService.logAdminActivity(
        req.admin.sub,
        'CREATE_GALLERY_ITEM',
        { itemId: item.id, title: item.title },
        req.ip
      );

      return res.status(201).json({
        message: 'Gallery item created successfully.',
        item
      });
    } catch (error) {
      next(error);
    }
  },

  async updateItem(req, res, next) {
    try {
      const { id } = req.params;
      const itemData = req.body;

      const item = await galleryService.updateGalleryItem(id, itemData);
      if (!item) {
        return res.status(404).json({ message: 'Gallery item not found or has been deleted.' });
      }

      await dashboardService.logAdminActivity(
        req.admin.sub,
        'UPDATE_GALLERY_ITEM',
        { itemId: id, title: item.title },
        req.ip
      );

      return res.status(200).json({
        message: 'Gallery item updated successfully.',
        item
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteItem(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await galleryService.deleteGalleryItem(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Gallery item not found or already deleted.' });
      }

      await dashboardService.logAdminActivity(
        req.admin.sub,
        'DELETE_GALLERY_ITEM',
        { itemId: id },
        req.ip
      );

      return res.status(200).json({ message: 'Gallery item deleted successfully (soft delete).' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Bulk reorder gallery items
   */
  async reorderItems(req, res, next) {
    try {
      const { reorderList } = req.body; // Array of { id, display_order }
      if (!reorderList || !Array.isArray(reorderList)) {
        return res.status(400).json({ message: 'reorderList must be an array of { id, display_order }' });
      }

      await galleryService.reorderGalleryItems(reorderList);

      await dashboardService.logAdminActivity(
        req.admin.sub,
        'REORDER_GALLERY_ITEMS',
        { count: reorderList.length },
        req.ip
      );

      return res.status(200).json({ message: 'Gallery items reordered successfully.' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Global Search on gallery
   */
  async search(req, res, next) {
    try {
      const { q } = req.query;
      const results = await galleryService.searchGallery(q);
      return res.status(200).json(results);
    } catch (error) {
      next(error);
    }
  }
};
