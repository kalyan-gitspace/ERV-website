import { galleryRepository } from '../repositories/gallery.repository.js';
import logger from '../config/logger.js';

export const galleryService = {
  // =========================================================================
  // CATEGORY SERVICES
  // =========================================================================

  async getAllCategories() {
    return await galleryRepository.findAllCategories();
  },

  async getCategoryBySlug(slug) {
    return await galleryRepository.findCategoryBySlug(slug);
  },

  async createCategory(name) {
    // Generate URL friendly slug
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    logger.info(`Creating gallery category: ${name} (slug: ${slug})`);
    return await galleryRepository.createCategory(name, slug);
  },

  async updateCategory(id, name) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    logger.info(`Updating gallery category ID ${id}: ${name}`);
    return await galleryRepository.updateCategory(id, name, slug);
  },

  async deleteCategory(id) {
    logger.info(`Deleting gallery category ID: ${id}`);
    return await galleryRepository.deleteCategory(id);
  },

  // =========================================================================
  // GALLERY ITEM SERVICES
  // =========================================================================

  /**
   * Fetch paginated gallery items with optional filters
   */
  async getGalleryItems(options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 12;
    const offset = (page - 1) * limit;

    const queryOptions = {
      categorySlug: options.categorySlug,
      tag: options.tag,
      limit,
      offset
    };

    const items = await galleryRepository.findAllItems(queryOptions);
    const totalItems = await galleryRepository.countItems(queryOptions);
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        limit
      }
    };
  },

  async getGalleryItemById(id) {
    return await galleryRepository.findItemById(id);
  },

  async createGalleryItem(itemData) {
    logger.info(`Adding gallery item: ${itemData.title}`);
    return await galleryRepository.createItem(itemData);
  },

  async updateGalleryItem(id, itemData) {
    logger.info(`Updating gallery item ID: ${id}`);
    return await galleryRepository.updateItem(id, itemData);
  },

  async deleteGalleryItem(id) {
    logger.info(`Soft deleting gallery item ID: ${id}`);
    return await galleryRepository.deleteItem(id);
  },

  /**
   * Bulk reorder gallery items
   * @param {Array<{id: string, display_order: number}>} reorderList
   */
  async reorderGalleryItems(reorderList) {
    logger.info('Reordering gallery items...');
    for (const item of reorderList) {
      await galleryRepository.updateDisplayOrder(item.id, item.display_order);
    }
    return true;
  },

  /**
   * Search gallery via Full-Text Search and tags
   */
  async searchGallery(query) {
    if (!query || query.trim() === '') {
      return (await this.getGalleryItems({ limit: 100 })).items;
    }
    return await galleryRepository.search(query);
  }
};
