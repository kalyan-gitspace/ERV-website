import { productRepository } from '../repositories/product.repository.js';
import logger from '../config/logger.js';

export const productService = {
  /**
   * Fetch all products
   */
  async getAllProducts() {
    return await productRepository.findAll();
  },

  /**
   * Get product by its unique URL slug
   */
  async getProductBySlug(slug) {
    const product = await productRepository.findBySlug(slug);
    if (!product) return null;

    // Fetch additional gallery images
    const images = await productRepository.getProductImages(product.id);
    return {
      ...product,
      galleryImages: images
    };
  },

  /**
   * Get product by ID
   */
  async getProductById(id) {
    const product = await productRepository.findById(id);
    if (!product) return null;

    const images = await productRepository.getProductImages(product.id);
    return {
      ...product,
      galleryImages: images
    };
  },

  /**
   * Create a new product and link its gallery images
   * @param {Object} productData - Product fields
   * @param {Array<string>} galleryImageIds - Array of media_library IDs for additional images
   */
  async createProduct(productData, galleryImageIds = []) {
    logger.info(`Creating product: ${productData.name}`);
    const product = await productRepository.create(productData);

    // If there are additional gallery images, link them
    if (galleryImageIds && galleryImageIds.length > 0) {
      for (let i = 0; i < galleryImageIds.length; i++) {
        await productRepository.addProductImage(product.id, galleryImageIds[i], i);
      }
    }

    return await this.getProductById(product.id);
  },

  /**
   * Update an existing product and its gallery images
   */
  async updateProduct(id, productData, galleryImageIds = null) {
    logger.info(`Updating product ID: ${id}`);
    const updatedProduct = await productRepository.update(id, productData);
    if (!updatedProduct) return null;

    // If galleryImageIds is provided (even if empty array), update the links
    if (galleryImageIds !== null) {
      await productRepository.clearProductImages(id);
      for (let i = 0; i < galleryImageIds.length; i++) {
        await productRepository.addProductImage(id, galleryImageIds[i], i);
      }
    }

    return await this.getProductById(id);
  },

  /**
   * Soft delete a product
   */
  async deleteProduct(id) {
    logger.info(`Soft deleting product ID: ${id}`);
    return await productRepository.delete(id);
  },

  /**
   * Search products via Full-Text Search
   */
  async searchProducts(query) {
    if (!query || query.trim() === '') {
      return await this.getAllProducts();
    }
    return await productRepository.search(query);
  }
};
